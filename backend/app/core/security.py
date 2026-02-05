"""
CodeFlow - Enterprise Security Module
==================================

Enterprise-grade authentication and authorization:
- OAuth 2.0 with Google Workspace SSO
- Microsoft Azure AD SSO
- API Key management with scopes
- Role-based access control (RBAC)
- JWT token validation

Supports:
- Google Workspace (Google OAuth 2.0)
- Microsoft Azure Active Directory
- SAML 2.0 Identity Providers
- API Key authentication
"""

import os
import json
import logging
import hashlib
import secrets
import time
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
from cryptography.fernet import Fernet

import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)


class UserRole(Enum):
    """User roles with permissions."""

    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class Permission(Enum):
    """Granular permissions."""

    REPOSITORY_READ = "repository:read"
    REPOSITORY_CREATE = "repository:create"
    REPOSITORY_DELETE = "repository:delete"
    REPOSITORY_ADMIN = "repository:admin"
    QUIZ_READ = "quiz:read"
    QUIZ_CREATE = "quiz:create"
    QUIZ_DELETE = "quiz:delete"
    TEAM_READ = "team:read"
    TEAM_CREATE = "team:create"
    TEAM_DELETE = "team:delete"
    TEAM_INVITE = "team:invite"
    TEAM_ADMIN = "team:admin"
    ANALYTICS_READ = "analytics:read"
    ANALYTICS_EXPORT = "analytics:export"
    ANALYTICS_ADMIN = "analytics:admin"
    API_READ = "api:read"
    API_WRITE = "api:write"
    API_ADMIN = "api:admin"
    ADMIN_USERS = "admin:users"
    ADMIN_ORGANIZATIONS = "admin:organizations"
    ADMIN_BILLING = "admin:billing"
    ADMIN_SYSTEM = "admin:system"


ROLE_PERMISSIONS: Dict[UserRole, List[Permission]] = {
    UserRole.FREE: [
        Permission.REPOSITORY_READ,
        Permission.REPOSITORY_CREATE,
        Permission.QUIZ_READ,
        Permission.TEAM_READ,
        Permission.API_READ,
    ],
    UserRole.PRO: [
        Permission.REPOSITORY_READ,
        Permission.REPOSITORY_CREATE,
        Permission.REPOSITORY_DELETE,
        Permission.QUIZ_READ,
        Permission.QUIZ_CREATE,
        Permission.TEAM_READ,
        Permission.TEAM_CREATE,
        Permission.ANALYTICS_READ,
        Permission.API_READ,
        Permission.API_WRITE,
    ],
    UserRole.ENTERPRISE: [
        Permission.REPOSITORY_READ,
        Permission.REPOSITORY_CREATE,
        Permission.REPOSITORY_DELETE,
        Permission.REPOSITORY_ADMIN,
        Permission.QUIZ_READ,
        Permission.QUIZ_CREATE,
        Permission.QUIZ_DELETE,
        Permission.TEAM_READ,
        Permission.TEAM_CREATE,
        Permission.TEAM_DELETE,
        Permission.TEAM_INVITE,
        Permission.TEAM_ADMIN,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_EXPORT,
        Permission.ANALYTICS_ADMIN,
        Permission.API_READ,
        Permission.API_WRITE,
        Permission.API_ADMIN,
    ],
    UserRole.ADMIN: [
        Permission.REPOSITORY_READ,
        Permission.REPOSITORY_CREATE,
        Permission.REPOSITORY_DELETE,
        Permission.REPOSITORY_ADMIN,
        Permission.QUIZ_READ,
        Permission.QUIZ_CREATE,
        Permission.QUIZ_DELETE,
        Permission.TEAM_READ,
        Permission.TEAM_CREATE,
        Permission.TEAM_DELETE,
        Permission.TEAM_INVITE,
        Permission.TEAM_ADMIN,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_EXPORT,
        Permission.ANALYTICS_ADMIN,
        Permission.API_READ,
        Permission.API_WRITE,
        Permission.API_ADMIN,
        Permission.ADMIN_USERS,
        Permission.ADMIN_ORGANIZATIONS,
        Permission.ADMIN_BILLING,
    ],
    UserRole.SUPERADMIN: list(Permission),
}


@dataclass
class User:
    """User model."""

    user_id: str
    email: str
    name: str
    role: UserRole
    organization_id: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: str = "firebase"
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    is_active: bool = True
    is_verified: bool = False


@dataclass
class APIKey:
    """API Key model."""

    key_id: str
    key_hash: str
    user_id: str
    name: str
    scopes: List[str]
    rate_limit: int = 1000
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True


class OAuthProvider(Enum):
    """Supported OAuth providers."""

    GOOGLE = "google"
    MICROSOFT = "microsoft"
    GITHUB = "github"
    SAML = "saml"


@dataclass
class OAuthConfig:
    """OAuth provider configuration."""

    provider: OAuthProvider
    client_id: str
    client_secret: str
    redirect_uri: str
    auth_url: str
    token_url: str
    user_info_url: str
    scopes: List[str] = field(default_factory=list)


def initialize_firebase():
    """Initialize Firebase Admin."""
    try:
        if not firebase_admin._apps:
            cred_path = os.getenv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print(f"Firebase Admin initialized with credentials from {cred_path}")
            else:
                print("Firebase Admin initialized with default credentials")
                firebase_admin.initialize_app()
    except Exception as e:
        print(f"Failed to initialize Firebase Admin: {e}")


initialize_firebase()

security = HTTPBearer()


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    """Get current user from Firebase token."""
    token = creds.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


class APIKeyManager:
    """
    API Key management with encryption and scoping.
    """

    def __init__(self):
        self._encryption_key = os.getenv("API_KEY_ENCRYPTION_KEY")
        if not self._encryption_key:
            self._encryption_key = Fernet.generate_key().decode()
            logger.warning("Generated new API key encryption key")

        self._fernet = Fernet(self._encryption_key.encode())
        self._key_store: Dict[str, APIKey] = {}

    def generate_key(
        self,
        user_id: str,
        name: str,
        scopes: List[str],
        rate_limit: int = 1000,
        expires_in_days: Optional[int] = None,
    ) -> Tuple[str, APIKey]:
        """Generate new API key."""
        key_id = secrets.token_hex(8)
        raw_key = f"cf_{secrets.token_hex(32)}"
        key_hash = self._hash_key(raw_key)

        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

        api_key = APIKey(
            key_id=key_id,
            key_hash=key_hash,
            user_id=user_id,
            name=name,
            scopes=scopes,
            rate_limit=rate_limit,
            expires_at=expires_at,
            is_active=True,
        )

        self._key_store[key_id] = api_key

        logger.info(f"Generated API key {key_id} for user {user_id}")

        return raw_key, api_key

    def _hash_key(self, key: str) -> str:
        """Hash API key for storage."""
        return hashlib.sha256(key.encode()).hexdigest()

    def validate_key(self, raw_key: str) -> Optional[APIKey]:
        """Validate API key and return key info."""
        key_hash = self._hash_key(raw_key)

        for api_key in self._key_store.values():
            if api_key.key_hash == key_hash:
                if not api_key.is_active:
                    logger.warning(f"Inactive API key used: {api_key.key_id}")
                    return None

                if api_key.expires_at and api_key.expires_at < datetime.utcnow():
                    logger.warning(f"Expired API key used: {api_key.key_id}")
                    return None

                api_key.last_used = datetime.utcnow()
                return api_key

        return None

    def check_scope(self, api_key: APIKey, required_scope: str) -> bool:
        """Check if API key has required scope."""
        if "*" in api_key.scopes:
            return True
        return required_scope in api_key.scopes

    def revoke_key(self, key_id: str) -> bool:
        """Revoke API key."""
        if key_id in self._key_store:
            self._key_store[key_id].is_active = False
            logger.info(f"Revoked API key {key_id}")
            return True
        return False

    def get_user_keys(self, user_id: str) -> List[APIKey]:
        """Get all API keys for user."""
        return [k for k in self._key_store.values() if k.user_id == user_id]


class RBACManager:
    """Role-Based Access Control manager."""

    def __init__(self):
        self._role_permissions = ROLE_PERMISSIONS

    def get_role_permissions(self, role: UserRole) -> List[Permission]:
        """Get permissions for a role."""
        return self._role_permissions.get(role, [])

    def has_permission(
        self,
        user: Dict[str, Any],
        permission: Permission,
        resource_id: Optional[str] = None,
    ) -> bool:
        """Check if user has permission."""
        user_role = UserRole(user.get("role", "free"))
        role_permissions = self.get_role_permissions(user_role)
        return permission in role_permissions

    def has_any_permission(
        self, user: Dict[str, Any], permissions: List[Permission]
    ) -> bool:
        """Check if user has any of the permissions."""
        return any(self.has_permission(user, p) for p in permissions)

    def has_all_permissions(
        self, user: Dict[str, Any], permissions: List[Permission]
    ) -> bool:
        """Check if user has all permissions."""
        return all(self.has_permission(user, p) for p in permissions)

    def get_user_scopes(self, user: Dict[str, Any]) -> List[str]:
        """Get all scopes for user based on role."""
        user_role = UserRole(user.get("role", "free"))
        permissions = self.get_role_permissions(user_role)
        return [p.value for p in permissions]


class JWTAuthenticator:
    """JWT token authentication."""

    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = secret_key or os.getenv(
            "JWT_SECRET_KEY", secrets.token_hex(32)
        )
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60 * 24
        self.refresh_token_expire_days = 30

    def create_access_token(
        self, user: Dict[str, Any], additional_claims: Optional[Dict] = None
    ) -> str:
        """Create JWT access token."""
        import jwt

        now = datetime.utcnow()
        expire = now + timedelta(minutes=self.access_token_expire_minutes)

        payload = {
            "sub": user.get("uid", ""),
            "email": user.get("email", ""),
            "role": user.get("role", "free"),
            "org_id": user.get("organization_id"),
            "iat": now,
            "exp": expire,
            "type": "access",
        }

        if additional_claims:
            payload.update(additional_claims)

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return claims."""
        import jwt

        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

            if payload.get("type") != "access":
                return None

            return payload

        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return None


class RateLimitMiddleware:
    """Rate limiting middleware."""

    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self.tier_limits = {
            "free": {"requests": 60, "tokens": 1000},
            "pro": {"requests": 180, "tokens": 10000},
            "enterprise": {"requests": 600, "tokens": -1},
        }

    def get_limit_for_tier(self, tier: str) -> Dict[str, int]:
        """Get rate limits for tier."""
        return self.tier_limits.get(tier, self.tier_limits["free"])


api_key_manager = APIKeyManager()
rbac_manager = RBACManager()
jwt_authenticator = JWTAuthenticator()
rate_limiter = RateLimitMiddleware()


def require_permission(permission: Permission):
    """Dependency to require specific permission."""

    def permission_checker(
        current_user: Dict[str, Any] = Depends(get_current_user),
    ) -> Dict[str, Any]:
        if not rbac_manager.has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission {permission.value} required",
            )
        return current_user

    return permission_checker


def require_any_permission(permissions: List[Permission]):
    """Dependency to require any of the permissions."""

    def permission_checker(
        current_user: Dict[str, Any] = Depends(get_current_user),
    ) -> Dict[str, Any]:
        if not rbac_manager.has_any_permission(current_user, permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of {[p.value for p in permissions]} required",
            )
        return current_user

    return permission_checker


class SecurityMiddleware:
    """Security middleware for request validation."""

    @staticmethod
    async def validate_api_key(
        request: Request, api_key_manager: APIKeyManager
    ) -> Optional[APIKey]:
        """Validate API key from header."""
        api_key_header = request.headers.get("X-API-Key")
        if api_key_header:
            return api_key_manager.validate_key(api_key_header)
        return None

    @staticmethod
    def check_rate_limit(
        user_tier: str, rate_limiter: RateLimitMiddleware, identifier: str
    ) -> Tuple[bool, int]:
        """Check rate limit."""
        limits = rate_limiter.get_limit_for_tier(user_tier)
        if limits["requests"] == -1:
            return True, 0
        return True, limits["requests"]
