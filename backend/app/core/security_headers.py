"""
CodeFlow - Security Headers Middleware
=======================================

Adds security headers to all responses for production deployment.
Implements OWASP recommendations for secure HTTP headers.
"""

import logging
from typing import Callable, Awaitable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses.

    Headers added:
    - X-Content-Type-Options: Prevents MIME type sniffing
    - X-Frame-Options: Prevents clickjacking
    - X-XSS-Protection: Legacy XSS protection
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Controls browser features
    - Content-Security-Policy: Prevents XSS and injections
    - Strict-Transport-Security: Enforces HTTPS
    """

    def __init__(
        self,
        app,
        csp_directives: dict = None,
        allow_framing: bool = False,
        max_age_seconds: int = 31536000,
    ):
        super().__init__(app)
        self.max_age = max_age_seconds
        self.allow_framing = allow_framing
        self.csp_directives = csp_directives or self._get_default_csp()

    def _get_default_csp(self) -> dict:
        """Get default Content-Security-Policy directives."""
        return {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "https://vercel.live"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "img-src": ["'self'", "data:", "https:"],
            "connect-src": [
                "'self'",
                "https://api.firebasedatabase.app",
                "https://*.googleapis.com",
            ],
            "frame-src": ["'self'"],
            "object-src": ["'none'"],
            "base-uri": ["'self'"],
            "form-action": ["'self'"],
            "frame-ancestors": ["'self'"],
            "upgrade-insecure-requests": [],
        }

    def _build_csp(self) -> str:
        """Build CSP header string from directives."""
        parts = []
        for directive, sources in self.csp_directives.items():
            if sources:
                parts.append(f"{directive} {' '.join(sources)}")
            else:
                parts.append(directive)
        return "; ".join(parts)

    def _build_headers(self) -> dict:
        """Build all security headers."""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN" if not self.allow_framing else "ALLOWALL",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": (
                "accelerometer=(), "
                "camera=(), "
                "geolocation=(), "
                "gyroscope=(), "
                "magnetometer=(), "
                "microphone=(), "
                "payment=(), "
                "usb=()"
            ),
            "Content-Security-Policy": self._build_csp(),
            "Strict-Transport-Security": f"max-age={self.max_age}; includeSubDomains; preload",
        }

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        if request.url.scheme == "https":
            for header, value in self._build_headers().items():
                if header not in response.headers:
                    response.headers[header] = value

        return response


class SecurityHeadersConfig:
    """Configuration for security headers."""

    def __init__(
        self,
        strict_transport_security: bool = True,
        content_security_policy: bool = True,
        x_content_type_options: bool = True,
        x_frame_options: bool = True,
        referrer_policy: bool = True,
        permissions_policy: bool = True,
        max_age: int = 31536000,
    ):
        self.strict_transport_security = strict_transport_security
        self.content_security_policy = content_security_policy
        self.x_content_type_options = x_content_type_options
        self.x_frame_options = x_frame_options
        self.referrer_policy = referrer_policy
        self.permissions_policy = permissions_policy
        self.max_age = max_age


def add_security_headers(
    response: Response, config: SecurityHeadersConfig = None
) -> Response:
    """
    Add security headers to a response.

    Args:
        response: FastAPI Response object
        config: SecurityHeadersConfig (uses defaults if None)

    Returns:
        Response with security headers added
    """
    if config is None:
        config = SecurityHeadersConfig()

    if config.x_content_type_options:
        response.headers["X-Content-Type-Options"] = "nosniff"

    if config.x_frame_options:
        response.headers["X-Frame-Options"] = "SAMEORIGIN"

    if config.referrer_policy:
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if config.permissions_policy:
        response.headers["Permissions-Policy"] = "deny()"

    if config.content_security_policy:
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://*.googleapis.com; "
            "frame-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )

    if config.strict_transport_security:
        response.headers["Strict-Transport-Security"] = (
            f"max-age={config.max_age}; includeSubDomains"
        )

    return response
