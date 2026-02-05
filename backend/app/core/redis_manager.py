"""
CodeFlow - Redis Integration Layer
==================================

Production-ready Redis integration with:
- Connection pooling
- Session management
- Rate limiting
- Caching with TTL
- Pub/Sub for A2A communication

Usage:
    from app.core.redis_manager import get_redis, RedisCache, RateLimiter

    redis = await get_redis()
    await redis.set_session(session_id, data)
"""

import os
import json
import asyncio
import logging
from typing import Optional, Any, Dict, List
from datetime import timedelta
from contextlib import asynccontextmanager

import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool

logger = logging.getLogger(__name__)


class RedisConfig:
    """Redis configuration."""

    @staticmethod
    def get_url() -> str:
        """Get Redis connection URL from environment."""
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", 6379))
        password = os.getenv("REDIS_PASSWORD", "")
        db = int(os.getenv("REDIS_DB", 0))

        if password:
            return f"redis://:{password}@{host}:{port}/{db}"
        return f"redis://{host}:{port}/{db}"

    @staticmethod
    def get_pool_size() -> int:
        """Get connection pool size."""
        return int(os.getenv("REDIS_POOL_SIZE", "50"))


class RedisManager:
    """
    Production Redis manager with connection pooling.

    Features:
    - Automatic reconnection
    - Connection health checks
    - metrics collection
    """

    _instance: Optional["RedisManager"] = None
    _pool: Optional[ConnectionPool] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self._client: Optional[redis.Redis] = None
        self._pool = None

        self._metrics = {"hits": 0, "misses": 0, "errors": 0, "operations": 0}

    async def connect(self) -> None:
        """Initialize Redis connection with pooling."""
        if self._client is not None:
            return

        try:
            pool_size = RedisConfig.get_pool_size()
            self._pool = ConnectionPool.from_url(
                RedisConfig.get_url(),
                max_connections=pool_size,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True,
            )

            self._client = redis.Redis(connection_pool=self._pool)

            await self._client.ping()
            logger.info("Redis connection established")

        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._client = None

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._client:
            await self._client.close()
            self._client = None

        if self._pool:
            await self._pool.disconnect()
            self._pool = None

        logger.info("Redis connection closed")

    @property
    def is_connected(self) -> bool:
        """Check if Redis is connected."""
        return self._client is not None

    def _track_operation(self, hit: bool = True):
        """Track cache operation metrics."""
        self._metrics["operations"] += 1
        if hit:
            self._metrics["hits"] += 1
        else:
            self._metrics["misses"] += 1

    def get_metrics(self) -> Dict[str, int]:
        """Get cache metrics."""
        total = self._metrics["hits"] + self._metrics["misses"]
        hit_rate = (self._metrics["hits"] / total * 100) if total > 0 else 0

        return {**self._metrics, "hit_rate_percent": round(hit_rate, 2)}


class RedisCache:
    """
    Redis cache with TTL support.

    Provides:
    - Automatic serialization
    - TTL management
    - Key prefixes for isolation
    """

    def __init__(self, manager: RedisManager):
        self._manager = manager
        self._prefix = os.getenv("REDIS_KEY_PREFIX", "codeflow:")

    def _make_key(self, key: str) -> str:
        """Create prefixed key."""
        return f"{self._prefix}{key}"

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self._manager.is_connected:
            return None

        try:
            full_key = self._make_key(key)
            value = await self._manager._client.get(full_key)

            if value is not None:
                self._manager._track_operation(hit=True)
                return json.loads(value)

            self._manager._track_operation(hit=False)
            return None

        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self._manager._metrics["errors"] += 1
            return None

    async def set(
        self, key: str, value: Any, ttl_seconds: Optional[int] = None
    ) -> bool:
        """Set value in cache with optional TTL."""
        if not self._manager.is_connected:
            return False

        try:
            full_key = self._make_key(key)
            serialized = json.dumps(value, default=str)

            if ttl_seconds:
                await self._manager._client.setex(full_key, ttl_seconds, serialized)
            else:
                await self._manager._client.set(full_key, serialized)

            return True

        except Exception as e:
            logger.error(f"Cache set error: {e}")
            self._manager._metrics["errors"] += 1
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self._manager.is_connected:
            return False

        try:
            full_key = self._make_key(key)
            await self._manager._client.delete(full_key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        if not self._manager.is_connected:
            return False

        try:
            full_key = self._make_key(key)
            return await self._manager._client.exists(full_key) > 0
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False

    async def get_or_set(
        self, key: str, factory: callable, ttl_seconds: Optional[int] = None
    ) -> Any:
        """Get value or set using factory function."""
        value = await self.get(key)

        if value is not None:
            return value

        value = await factory()
        await self.set(key, value, ttl_seconds)
        return value

    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern."""
        if not self._manager.is_connected:
            return 0

        try:
            full_pattern = self._make_key(pattern)
            keys = await self._manager._client.keys(full_pattern)

            if keys:
                return await self._manager._client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return 0


class SessionManager:
    """
    Session management with Redis.

    Features:
    - Session storage with TTL
    - User session tracking
    - Concurrent session support
    """

    SESSION_TTL = int(os.getenv("SESSION_TTL_HOURS", "24")) * 3600

    def __init__(self, manager: RedisManager):
        self._manager = manager
        self._prefix = "session:"

    def _make_key(self, key: str) -> str:
        return f"{self._prefix}{key}"

    async def create_session(
        self,
        session_id: str,
        user_id: str,
        data: Dict[str, Any],
        ttl: int = SESSION_TTL,
    ) -> bool:
        """Create a new session."""
        if not self._manager.is_connected:
            return False

        try:
            key = self._make_key(session_id)
            session_data = {
                "session_id": session_id,
                "user_id": user_id,
                "data": data,
                "created_at": asyncio.get_event_loop().time(),
            }

            await self._manager._client.hset(
                key,
                mapping={
                    "user_id": user_id,
                    "session_data": json.dumps(data),
                    "created_at": str(session_data["created_at"]),
                },
            )

            await self._manager._client.expire(key, ttl)

            await self._manager._client.sadd(
                self._make_key(f"user:{user_id}"), session_id
            )

            return True
        except Exception as e:
            logger.error(f"Session creation error: {e}")
            return False

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data."""
        if not self._manager.is_connected:
            return None

        try:
            key = self._make_key(session_id)
            data = await self._manager._client.hgetall(key)

            if not data:
                return None

            return {
                "session_id": session_id,
                "user_id": data.get("user_id"),
                "data": json.loads(data.get("session_data", "{}")),
                "created_at": float(data.get("created_at", 0)),
            }
        except Exception as e:
            logger.error(f"Session get error: {e}")
            return None

    async def update_session(self, session_id: str, data: Dict[str, Any]) -> bool:
        """Update session data."""
        if not self._manager.is_connected:
            return False

        try:
            key = self._make_key(session_id)
            await self._manager._client.hset(key, "session_data", json.dumps(data))
            return True
        except Exception as e:
            logger.error(f"Session update error: {e}")
            return False

    async def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        if not self._manager.is_connected:
            return False

        try:
            key = self._make_key(session_id)
            session = await self.get_session(session_id)

            if session:
                await self._manager._client.srem(
                    self._make_key(f"user:{session['user_id']}"), session_id
                )

            await self._manager._client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Session delete error: {e}")
            return False

    async def get_user_sessions(self, user_id: str) -> List[str]:
        """Get all sessions for a user."""
        if not self._manager.is_connected:
            return []

        try:
            return list(
                await self._manager._client.smembers(self._make_key(f"user:{user_id}"))
            )
        except Exception as e:
            logger.error(f"User sessions error: {e}")
            return []


class RateLimiter:
    """
    Token bucket rate limiter using Redis.

    Features:
    - Per-user rate limiting
    - Sliding window algorithm
    - Configurable limits
    """

    def __init__(self, manager: RedisManager):
        self._manager = manager
        self._prefix = "ratelimit:"

    def _make_key(self, key: str) -> str:
        return f"{self._prefix}{key}"

    async def check_rate_limit(
        self, identifier: str, max_requests: int, window_seconds: int
    ) -> Dict[str, Any]:
        """
        Check rate limit for identifier.

        Returns:
            {
                "allowed": bool,
                "remaining": int,
                "reset_at": float,
                "retry_after": Optional[int]
            }
        """
        if not self._manager.is_connected:
            return {"allowed": True, "remaining": max_requests}

        try:
            key = self._make_key(identifier)
            now = asyncio.get_event_loop().time()
            window_start = now - window_seconds

            pipe = self._manager._client.pipeline()

            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zadd(key, {f"{now}": now})
            pipe.zcard(key)
            pipe.expire(key, window_seconds + 1)

            results = await pipe.execute()
            current_count = results[2]

            if current_count > max_requests:
                oldest = await self._manager._client.zrange(key, 0, 0, withscores=True)
                retry_after = (
                    int(oldest[0][1] + window_seconds - now)
                    if oldest
                    else window_seconds
                )

                return {
                    "allowed": False,
                    "remaining": 0,
                    "retry_after": retry_after,
                    "limit": max_requests,
                }

            return {
                "allowed": True,
                "remaining": max_requests - current_count,
                "reset_at": now + window_seconds,
                "limit": max_requests,
            }
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return {"allowed": True, "remaining": max_requests}

    async def check_tier_limit(
        self, user_id: str, tier: str, limit_type: str = "requests"
    ) -> Dict[str, Any]:
        """Check tier-based rate limit."""
        limits = {
            "free": {"requests": 60, "tokens": 1000},
            "pro": {"requests": 180, "tokens": 10000},
            "enterprise": {"requests": 600, "tokens": -1},
        }

        tier_limits = limits.get(tier, limits["free"])
        max_requests = tier_limits.get(limit_type, 60)

        if limit_type == "tokens" and max_requests == -1:
            return {"allowed": True, "remaining": -1, "unlimited": True}

        return await self.check_rate_limit(
            f"{user_id}:{limit_type}",
            max_requests,
            60 if limit_type == "requests" else 86400,
        )


class PubSubManager:
    """
    Redis Pub/Sub manager for A2A communication.

    Features:
    - Channel subscription
    - Message publishing
    - Async message handling
    """

    def __init__(self, manager: RedisManager):
        self._manager = manager
        self._pubsub: Optional[redis.client.PubSub] = None
        self._subscriptions: Dict[str, asyncio.Queue] = {}
        self._running = False

    async def subscribe(self, channel: str, queue: asyncio.Queue) -> None:
        """Subscribe to a channel."""
        self._subscriptions[channel] = queue

        if self._pubsub is None:
            self._pubsub = self._manager._client.pubsub()

        await self._pubsub.subscribe(channel)
        logger.info(f"Subscribed to channel: {channel}")

    async def unsubscribe(self, channel: str) -> None:
        """Unsubscribe from a channel."""
        self._subscriptions.pop(channel, None)

        if self._pubsub:
            await self._pubsub.unsubscribe(channel)

    async def publish(self, channel: str, message: Dict[str, Any]) -> int:
        """Publish message to channel."""
        if not self._manager.is_connected:
            return 0

        try:
            return await self._manager._client.publish(channel, json.dumps(message))
        except Exception as e:
            logger.error(f"Publish error: {e}")
            return 0

    async def start_listening(self) -> None:
        """Start listening for messages."""
        if not self._pubsub or self._running:
            return

        self._running = True

        async def listener():
            while self._running:
                try:
                    message = await self._pubsub.get_message(
                        ignore_subscribe_messages=True, timeout=1.0
                    )

                    if message and message["type"] == "message":
                        channel = message["channel"]
                        if channel in self._subscriptions:
                            data = json.loads(message["data"])
                            await self._subscriptions[channel].put(data)
                except Exception as e:
                    logger.error(f"PubSub listener error: {e}")

        asyncio.create_task(listener())

    async def stop_listening(self) -> None:
        """Stop listening for messages."""
        self._running = False

        if self._pubsub:
            await self._pubsub.close()
            self._pubsub = None


_redis_manager: Optional[RedisManager] = None
_redis_cache: Optional[RedisCache] = None
_session_manager: Optional[SessionManager] = None
_rate_limiter: Optional[RateLimiter] = None
_pubsub_manager: Optional[PubSubManager] = None


async def get_redis() -> RedisManager:
    """Get or create Redis manager instance."""
    global _redis_manager

    if _redis_manager is None:
        _redis_manager = RedisManager()
        await _redis_manager.connect()

    return _redis_manager


async def get_cache() -> RedisCache:
    """Get or create Redis cache instance."""
    global _redis_cache, _redis_manager

    if _redis_cache is None:
        manager = await get_redis()
        _redis_cache = RedisCache(manager)

    return _redis_cache


async def get_session_manager() -> SessionManager:
    """Get or create session manager instance."""
    global _session_manager, _redis_manager

    if _session_manager is None:
        manager = await get_redis()
        _session_manager = SessionManager(manager)

    return _session_manager


async def get_rate_limiter() -> RateLimiter:
    """Get or create rate limiter instance."""
    global _rate_limiter, _redis_manager

    if _rate_limiter is None:
        manager = await get_redis()
        _rate_limiter = RateLimiter(manager)

    return _rate_limiter


async def get_pubsub_manager() -> PubSubManager:
    """Get or create PubSub manager instance."""
    global _pubsub_manager, _redis_manager

    if _pubsub_manager is None:
        manager = await get_redis()
        _pubsub_manager = PubSubManager(manager)

    return _pubsub_manager


async def shutdown_redis() -> None:
    """Shutdown all Redis connections."""
    global \
        _redis_manager, \
        _redis_cache, \
        _session_manager, \
        _rate_limiter, \
        _pubsub_manager

    if _pubsub_manager:
        await _pubsub_manager.stop_listening()

    if _redis_manager:
        await _redis_manager.disconnect()

    _redis_manager = None
    _redis_cache = None
    _session_manager = None
    _rate_limiter = None
    _pubsub_manager = None
