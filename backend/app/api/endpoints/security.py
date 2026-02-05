"""
CodeFlow - Security API Endpoints
================================

API endpoints for:
- API Key management
- OAuth authentication
- User management
- Security settings

Usage:
    from app.api.endpoints.security import router
    app.include_router(router, prefix="/api/v1/security")
"""

import os
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field

from app.core.security import (
    get_current_user,
    api_key_manager,
    rbac_manager,
    jwt_authenticator,
    require_permission,
    Permission,
    UserRole,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/security", tags=["security"])


# Request/Response Models
class APIKeyCreateRequest(BaseModel):
    """Request to create API key."""

    name: str = Field(..., min_length=1, max_length=100)
    scopes: List[str] = Field(..., min_items=1)
    rate_limit: int = Field(default=1000, ge=100, le=100000)
    expires_in_days: Optional[int] = Field(default=None, ge=1, le=365)


class APIKeyResponse(BaseModel):
    """API key response (without secret)."""

    key_id: str
    name: str
    scopes: List[str]
    rate_limit: int
    created_at: str
    last_used: Optional[str] = None
    expires_at: Optional[str] = None
    is_active: bool


class APIKeyCreatedResponse(BaseModel):
    """Response when API key is created (includes secret)."""

    key_id: str
    name: str
    key: str
    scopes: List[str]
    rate_limit: int
    created_at: str
    expires_at: Optional[str] = None


class TokenRefreshRequest(BaseModel):
    """Request to refresh token."""

    refresh_token: str


class TokenResponse(BaseModel):
    """Token response."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class UserPermissionsResponse(BaseModel):
    """User permissions response."""

    user_id: str
    email: str
    role: str
    permissions: List[str]
    scopes: List[str]


class RateLimitStatusResponse(BaseModel):
    """Rate limit status response."""

    tier: str
    requests_per_minute: int
    tokens_per_day: int
    current_usage: Dict[str, int]


# API Key Endpoints
@router.post("/api-keys", response_model=APIKeyCreatedResponse)
async def create_api_key(
    request: APIKeyCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Create new API key.

    The API key secret is only shown once - store it securely.
    """
    user_id = current_user.get("uid")

    raw_key, api_key = api_key_manager.generate_key(
        user_id=user_id,
        name=request.name,
        scopes=request.scopes,
        rate_limit=request.rate_limit,
        expires_in_days=request.expires_in_days,
    )

    return APIKeyCreatedResponse(
        key_id=api_key.key_id,
        name=api_key.name,
        key=raw_key,
        scopes=api_key.scopes,
        rate_limit=api_key.rate_limit,
        created_at=api_key.created_at.isoformat(),
        expires_at=api_key.expires_at.isoformat() if api_key.expires_at else None,
    )


@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(current_user: Dict[str, Any] = Depends(get_current_user)):
    """List all API keys for current user."""
    user_id = current_user.get("uid")
    keys = api_key_manager.get_user_keys(user_id)

    return [
        APIKeyResponse(
            key_id=k.key_id,
            name=k.name,
            scopes=k.scopes,
            rate_limit=k.rate_limit,
            created_at=k.created_at.isoformat(),
            last_used=k.last_used.isoformat() if k.last_used else None,
            expires_at=k.expires_at.isoformat() if k.expires_at else None,
            is_active=k.is_active,
        )
        for k in keys
    ]


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str, current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Revoke API key."""
    user_id = current_user.get("uid")
    keys = api_key_manager.get_user_keys(user_id)

    key = next((k for k in keys if k.key_id == key_id), None)

    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="API key not found"
        )

    api_key_manager.revoke_key(key_id)

    return {"message": "API key revoked successfully"}


# Token Endpoints
@router.post("/token/refresh", response_model=TokenResponse)
async def refresh_token(request: TokenRefreshRequest):
    """Refresh access token using refresh token."""
    result = jwt_authenticator.refresh_access_token(request.refresh_token)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    access_token, refresh_token = result

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in=86400,
    )


# Permissions Endpoints
@router.get("/permissions", response_model=UserPermissionsResponse)
async def get_user_permissions(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get current user's permissions."""
    role = current_user.get("role", "free")
    user_role = UserRole(role)

    permissions = rbac_manager.get_role_permissions(user_role)
    scopes = rbac_manager.get_user_scopes(current_user)

    return UserPermissionsResponse(
        user_id=current_user.get("uid"),
        email=current_user.get("email", ""),
        role=role,
        permissions=[p.value for p in permissions],
        scopes=scopes,
    )


@router.get("/permissions/{permission}")
async def check_permission(
    permission: str, current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Check if user has specific permission."""
    try:
        perm = Permission(permission)
        has_perm = rbac_manager.has_permission(current_user, perm)

        return {"permission": permission, "allowed": has_perm}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid permission: {permission}",
        )


# Rate Limit Status
@router.get("/rate-limit", response_model=RateLimitStatusResponse)
async def get_rate_limit_status(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get current user's rate limit status."""
    role = current_user.get("role", "free")
    user_role = UserRole(role)

    tier_limits = {
        UserRole.FREE: {"requests": 60, "tokens": 1000},
        UserRole.PRO: {"requests": 180, "tokens": 10000},
        UserRole.ENTERPRISE: {"requests": 600, "tokens": -1},
        UserRole.ADMIN: {"requests": 600, "tokens": -1},
        UserRole.SUPERADMIN: {"requests": 600, "tokens": -1},
    }

    limits = tier_limits.get(user_role, tier_limits[UserRole.FREE])

    return RateLimitStatusResponse(
        tier=role,
        requests_per_minute=limits["requests"],
        tokens_per_day=limits["tokens"],
        current_usage={"requests": 0, "tokens": 0},
    )


# OAuth Configuration
class OAuthProviderResponse(BaseModel):
    """OAuth provider configuration."""

    provider: str
    client_id: str
    auth_url: str
    scopes: List[str]
    enabled: bool


@router.get("/oauth/providers", response_model=List[OAuthProviderResponse])
async def get_oauth_providers():
    """Get configured OAuth providers."""
    providers = []

    if os.getenv("GOOGLE_CLIENT_ID"):
        providers.append(
            OAuthProviderResponse(
                provider="google",
                client_id=os.getenv("GOOGLE_CLIENT_ID", "")[:8] + "...",
                auth_url="https://accounts.google.com/o/oauth2/v2/auth",
                scopes=["openid", "email", "profile"],
                enabled=True,
            )
        )

    if os.getenv("AZURE_CLIENT_ID"):
        providers.append(
            OAuthProviderResponse(
                provider="microsoft",
                client_id=os.getenv("AZURE_CLIENT_ID", "")[:8] + "...",
                auth_url=f"https://login.microsoftonline.com/{os.getenv('AZURE_TENANT_ID')}/oauth2/v2.0/authorize",
                scopes=["openid", "email", "profile", "User.Read"],
                enabled=True,
            )
        )

    return providers


# Security Audit
class AuditLogResponse(BaseModel):
    """Audit log entry."""

    timestamp: str
    action: str
    resource: str
    user_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


@router.get("/audit", response_model=List[AuditLogResponse])
async def get_audit_log(
    limit: int = 100,
    current_user: Dict[str, Any] = Depends(require_permission(Permission.ADMIN_USERS)),
):
    """Get security audit log (admin only)."""
    return []


# Health Check
@router.get("/health")
async def security_health():
    """Security module health check."""
    return {
        "status": "healthy",
        "modules": {
            "authentication": "active",
            "authorization": "active",
            "api_keys": "active",
            "rate_limiting": "active",
        },
    }
