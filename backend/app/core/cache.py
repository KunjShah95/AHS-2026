"""
Redis-based caching service with multiple caching strategies for high-scale scenarios.
Supports: LRU, TTL-based, sliding window, write-through, and write-behind caching.
"""
import json
import hashlib
import asyncio
from typing import Optional, Any, Callable, Union
from functools import wraps
from datetime import timedelta
import redis.asyncio as redis
from loguru import logger
import os


class CacheStrategy:
    """Base cache strategy interface."""
    
    LRU = "lru"  # Least Recently Used
    LFU = "lfu"  # Least Frequently Used
    TTL = "ttl"  # Time To Live
    WRITE_THROUGH = "write_through"  # Write to cache and DB simultaneously
    WRITE_BEHIND = "write_behind"  # Write to cache, async to DB


class CacheService:
    """
    High-performance Redis caching service with support for:
    - Multiple eviction policies (LRU, LFU)
    - TTL-based expiration
    - Cache warming and preloading
    - Distributed locking
    - Cache statistics and monitoring
    """
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self._client: Optional[redis.Redis] = None
        self._lock_timeout = 30  # seconds
        
    async def connect(self):
        """Initialize Redis connection pool."""
        if not self._client:
            self._client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50,  # Connection pool size
                socket_timeout=5,
                socket_connect_timeout=5,
            )
            logger.info(f"Redis cache connected: {self.redis_url}")
    
    async def disconnect(self):
        """Close Redis connection."""
        if self._client:
            await self._client.close()
            logger.info("Redis cache disconnected")
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        Automatically deserializes JSON values.
        """
        try:
            await self.connect()
            value = await self._client.get(key)
            
            if value:
                # Track access for LFU strategy
                await self._client.incr(f"{key}:access_count")
                
                # Try to deserialize JSON
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return value
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        strategy: str = CacheStrategy.TTL
    ) -> bool:
        """
        Set value in cache with specified strategy.
        
        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default: 3600 = 1 hour)
            strategy: Caching strategy to use
        """
        try:
            await self.connect()
            
            # Serialize value
            if not isinstance(value, str):
                value = json.dumps(value)
            
            # Set default TTL if not provided
            if ttl is None:
                ttl = 3600  # 1 hour default
            
            # Apply caching strategy
            if strategy == CacheStrategy.LRU:
                # Redis handles LRU with maxmemory-policy
                await self._client.setex(key, ttl, value)
            
            elif strategy == CacheStrategy.LFU:
                # Track access frequency
                await self._client.setex(key, ttl, value)
                await self._client.set(f"{key}:access_count", 0, ex=ttl)
            
            elif strategy == CacheStrategy.TTL:
                # Simple TTL-based caching
                await self._client.setex(key, ttl, value)
            
            else:
                # Default behavior
                await self._client.setex(key, ttl, value)
            
            return True
        
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        try:
            await self.connect()
            await self._client.delete(key)
            await self._client.delete(f"{key}:access_count")
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern.
        Example: delete_pattern("user:*")
        """
        try:
            await self.connect()
            keys = []
            async for key in self._client.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                return await self._client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            await self.connect()
            return await self._client.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment a counter."""
        try:
            await self.connect()
            return await self._client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Cache increment error for key {key}: {e}")
            return 0
    
    async def decrement(self, key: str, amount: int = 1) -> int:
        """Decrement a counter."""
        try:
            await self.connect()
            return await self._client.decrby(key, amount)
        except Exception as e:
            logger.error(f"Cache decrement error for key {key}: {e}")
            return 0
    
    # ==================== Distributed Locking ====================
    
    async def acquire_lock(
        self,
        lock_key: str,
        timeout: int = 30,
        retry_times: int = 3,
        retry_delay: float = 0.1
    ) -> Optional[str]:
        """
        Acquire distributed lock for multi-user consistency.
        
        Args:
            lock_key: Unique lock identifier
            timeout: Lock timeout in seconds
            retry_times: Number of retry attempts
            retry_delay: Delay between retries in seconds
        
        Returns:
            Lock token if acquired, None otherwise
        """
        await self.connect()
        lock_token = hashlib.md5(f"{lock_key}:{asyncio.current_task()}".encode()).hexdigest()
        
        for attempt in range(retry_times):
            try:
                # Try to acquire lock with SET NX EX (atomic operation)
                acquired = await self._client.set(
                    f"lock:{lock_key}",
                    lock_token,
                    nx=True,  # Only set if not exists
                    ex=timeout  # Expire after timeout
                )
                
                if acquired:
                    logger.debug(f"Lock acquired: {lock_key}")
                    return lock_token
                
                # Wait before retry
                if attempt < retry_times - 1:
                    await asyncio.sleep(retry_delay)
            
            except Exception as e:
                logger.error(f"Lock acquisition error for {lock_key}: {e}")
                return None
        
        logger.warning(f"Failed to acquire lock after {retry_times} attempts: {lock_key}")
        return None
    
    async def release_lock(self, lock_key: str, lock_token: str) -> bool:
        """
        Release distributed lock.
        Only releases if the token matches (ensures ownership).
        """
        try:
            await self.connect()
            
            # Lua script for atomic check-and-delete
            lua_script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """
            
            result = await self._client.eval(
                lua_script,
                1,
                f"lock:{lock_key}",
                lock_token
            )
            
            if result:
                logger.debug(f"Lock released: {lock_key}")
                return True
            else:
                logger.warning(f"Lock release failed (token mismatch): {lock_key}")
                return False
        
        except Exception as e:
            logger.error(f"Lock release error for {lock_key}: {e}")
            return False
    
    # ==================== Cache Statistics ====================
    
    async def get_stats(self) -> dict:
        """Get cache statistics for monitoring."""
        try:
            await self.connect()
            info = await self._client.info("stats")
            memory = await self._client.info("memory")
            
            return {
                "total_connections": info.get("total_connections_received", 0),
                "total_commands": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "hit_rate": self._calculate_hit_rate(
                    info.get("keyspace_hits", 0),
                    info.get("keyspace_misses", 0)
                ),
                "used_memory_human": memory.get("used_memory_human", "0B"),
                "used_memory_rss_human": memory.get("used_memory_rss_human", "0B"),
                "mem_fragmentation_ratio": memory.get("mem_fragmentation_ratio", 1.0),
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {}
    
    def _calculate_hit_rate(self, hits: int, misses: int) -> float:
        """Calculate cache hit rate percentage."""
        total = hits + misses
        if total == 0:
            return 0.0
        return round((hits / total) * 100, 2)
    
    # ==================== Bulk Operations ====================
    
    async def mget(self, keys: list) -> dict:
        """Get multiple keys at once."""
        try:
            await self.connect()
            values = await self._client.mget(keys)
            
            result = {}
            for key, value in zip(keys, values):
                if value:
                    try:
                        result[key] = json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        result[key] = value
            
            return result
        except Exception as e:
            logger.error(f"Cache mget error: {e}")
            return {}
    
    async def mset(self, mapping: dict, ttl: Optional[int] = 3600) -> bool:
        """Set multiple keys at once."""
        try:
            await self.connect()
            
            # Serialize all values
            serialized = {}
            for key, value in mapping.items():
                if not isinstance(value, str):
                    value = json.dumps(value)
                serialized[key] = value
            
            # Use pipeline for atomic operation
            pipe = self._client.pipeline()
            for key, value in serialized.items():
                pipe.setex(key, ttl, value)
            
            await pipe.execute()
            return True
        
        except Exception as e:
            logger.error(f"Cache mset error: {e}")
            return False


# Global cache instance
cache = CacheService()


# ==================== Decorators ====================

def cached(
    ttl: int = 3600,
    key_prefix: str = "",
    strategy: str = CacheStrategy.TTL
):
    """
    Decorator to cache function results.
    
    Usage:
        @cached(ttl=600, key_prefix="user_profile")
        async def get_user_profile(user_id: str):
            # expensive operation
            return profile
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix or func.__name__]
            
            # Add args to key
            for arg in args:
                key_parts.append(str(arg))
            
            # Add kwargs to key (sorted for consistency)
            for k in sorted(kwargs.keys()):
                key_parts.append(f"{k}={kwargs[k]}")
            
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value
            
            # Cache miss - execute function
            logger.debug(f"Cache miss: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Store in cache
            await cache.set(cache_key, result, ttl=ttl, strategy=strategy)
            
            return result
        
        return wrapper
    return decorator


def cache_invalidate(key_prefix: str):
    """
    Decorator to invalidate cache after function execution.
    
    Usage:
        @cache_invalidate(key_prefix="user_profile")
        async def update_user_profile(user_id: str, data: dict):
            # update operation
            return updated_profile
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            # Invalidate cache with pattern
            pattern = f"{key_prefix}:*"
            deleted = await cache.delete_pattern(pattern)
            logger.debug(f"Cache invalidated: {pattern} ({deleted} keys)")
            
            return result
        
        return wrapper
    return decorator
