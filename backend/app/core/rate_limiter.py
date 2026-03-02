"""
CodeFlow - Rate Limiting Module
================================

Redis-backed distributed rate limiting using sliding window algorithm.
Supports per-user, per-endpoint, and global rate limits.
"""

import time
import logging
from typing import Optional, Dict, Tuple
from dataclasses import dataclass
from enum import Enum

import redis.asyncio as redis
from fastapi import Request, HTTPException, status

logger = logging.getLogger(__name__)


class RateLimitTier(Enum):
    """Rate limit tiers based on user subscription."""

    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass
class RateLimitConfig:
    """Rate limit configuration."""

    requests_per_minute: int
    requests_per_hour: int
    requests_per_day: int
    burst_size: int


TIER_CONFIGS: Dict[RateLimitTier, RateLimitConfig] = {
    RateLimitTier.FREE: RateLimitConfig(
        requests_per_minute=30,
        requests_per_hour=500,
        requests_per_day=5000,
        burst_size=10,
    ),
    RateLimitTier.PRO: RateLimitConfig(
        requests_per_minute=120,
        requests_per_hour=5000,
        requests_per_day=50000,
        burst_size=50,
    ),
    RateLimitTier.ENTERPRISE: RateLimitConfig(
        requests_per_minute=600,
        requests_per_hour=50000,
        requests_per_day=-1,
        burst_size=200,
    ),
}


class RateLimiter:
    """
    Distributed rate limiter using Redis sliding window algorithm.

    Features:
    - Sliding window for smooth rate limiting
    - Per-endpoint and global limits
    - Automatic tier-based limits
    - Retry-After header support
    """

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self._redis: Optional[redis.Redis] = None

    async def get_redis(self) -> redis.Redis:
        """Get or create Redis connection."""
        if self._redis is None:
            self._redis = redis.from_url(
                self.redis_url, encoding="utf-8", decode_responses=True
            )
        return self._redis

    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None

    def _get_key(self, identifier: str, window: str, endpoint: str = "*") -> str:
        """Generate rate limit key."""
        return f"ratelimit:{identifier}:{window}:{endpoint}"

    async def check_rate_limit(
        self,
        identifier: str,
        tier: RateLimitTier = RateLimitTier.FREE,
        endpoint: str = "*",
        endpoint_type: str = "api",
    ) -> Tuple[bool, int, int]:
        """
        Check if request is within rate limits.

        Returns:
            (is_allowed, remaining, retry_after_seconds)
        """
        config = TIER_CONFIGS[tier]
        r = await self.get_redis()

        now = time.time()
        window_key = "minute"

        if endpoint_type == "ai":
            window_key = "minute"
        elif endpoint_type == "heavy":
            window_key = "hour"

        key = self._get_key(identifier, window_key, endpoint)
        limit = (
            config.requests_per_minute
            if window_key == "minute"
            else config.requests_per_hour
        )

        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 3600 if window_key == "hour" else 60)
        results = await pipe.execute()

        current = results[0]
        remaining = max(0, limit - current)
        retry_after = 0

        is_allowed = current <= limit

        if not is_allowed:
            ttl = await r.ttl(key)
            retry_after = max(1, ttl)

        return is_allowed, remaining, retry_after

    async def check_global_rate_limit(
        self, limit_type: str, limit: int, window_seconds: int = 60
    ) -> Tuple[bool, int]:
        """
        Check global rate limit (e.g., AI API calls across all users).

        Args:
            limit_type: Type of limit (e.g., "ai_requests", "embeddings")
            limit: Maximum requests in window
            window_seconds: Time window in seconds
        """
        r = await self.get_redis()
        key = f"ratelimit:global:{limit_type}"

        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = await pipe.execute()

        current = results[0]
        remaining = max(0, limit - current)
        is_allowed = current <= limit

        return is_allowed, remaining

    async def get_usage_stats(self, identifier: str) -> Dict[str, int]:
        """Get current usage statistics for identifier."""
        r = await self.get_redis()
        stats = {}

        for window in ["minute", "hour", "day"]:
            key = self._get_key(identifier, window, "*")
            count = await r.get(key)
            stats[window] = int(count) if count else 0

        return stats


class RateLimitMiddleware:
    """
    FastAPI middleware for automatic rate limiting.

    Usage:
        app.add_middleware(RateLimitMiddleware)
    """

    def __init__(
        self,
        limiter: RateLimiter,
        exclude_paths: list = None,
        user_tier_header: str = "X-User-Tier",
    ):
        self.limiter = limiter
        self.exclude_paths = exclude_paths or ["/health", "/docs", "/openapi.json"]
        self.user_tier_header = user_tier_header

    async def __call__(self, request: Request, call_next):
        path = request.url.path

        if any(path.startswith(excl) for excl in self.exclude_paths):
            return await call_next(request)

        identifier = self._get_identifier(request)
        tier = self._get_tier(request)
        endpoint_type = self._get_endpoint_type(path)

        is_allowed, remaining, retry_after = await self.limiter.check_rate_limit(
            identifier=identifier, tier=tier, endpoint=path, endpoint_type=endpoint_type
        )

        response = await call_next(request)

        response.headers["X-RateLimit-Limit"] = str(
            remaining + (1 if is_allowed else 0)
        )
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        if not is_allowed:
            response.headers["Retry-After"] = str(retry_after)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "retry_after": retry_after,
                    "message": f"Too many requests. Please retry in {retry_after} seconds.",
                },
                headers={"Retry-After": str(retry_after)},
            )

        return response

    def _get_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting."""
        if request.headers.get("X-API-Key"):
            return f"apikey:{request.headers.get('X-API-Key')[:8]}"

        if request.headers.get("Authorization"):
            return f"user:{hash(request.headers.get('Authorization'))}"

        return f"ip:{request.client.host}"

    def _get_tier(self, request: Request) -> RateLimitTier:
        """Get user tier from request."""
        tier_header = request.headers.get(self.user_tier_header, "free")
        try:
            return RateLimitTier(tier_header.lower())
        except ValueError:
            return RateLimitTier.FREE

    def _get_endpoint_type(self, path: str) -> str:
        """Determine endpoint type for appropriate rate limiting."""
        if "/ai/" in path or "/gemini/" in path or "/adk/" in path:
            return "ai"
        elif any(x in path for x in ["/analytics", "/export", "/batch"]):
            return "heavy"
        return "api"


# Global rate limiter instance
rate_limiter = RateLimiter()
