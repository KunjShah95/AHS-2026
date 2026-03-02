"""
Advanced Rate Limiting Service with multiple algorithms including sliding window.
This extends the basic rate_limiter.py with more sophisticated algorithms.
"""
import time
from typing import Optional, Tuple, List
from functools import wraps
import redis.asyncio as redis
from loguru import logger
import os
import asyncio


class SlidingWindowRateLimiter:
    """
    Sliding Window Rate Limiter - Most accurate algorithm that prevents
    burst attacks at window boundaries.
    
    Uses Redis sorted sets to track individual request timestamps.
    """
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self._client = redis_client
    
    async def connect(self):
        """Initialize Redis connection."""
        if not self._client:
            self._client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=False,
                max_connections=50,
            )
            logger.info("Sliding window rate limiter connected")
    
    async def check_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> Tuple[bool, dict]:
        """
        Check rate limit using precise sliding window algorithm.
        
        Time Complexity: O(log N + M) where N is total requests, M is old requests
        Space Complexity: O(N) where N is requests in window
        
        Returns:
            (allowed, info) tuple with detailed limit information
        """
        await self.connect()
        
        current_time = time.time()
        window_start = current_time - window_seconds
        rate_key = f"sliding:window:{key}"
        
        try:
            pipe = self._client.pipeline()
            
            # Remove expired requests (outside window)
            pipe.zremrangebyscore(rate_key, 0, window_start)
            
            # Count current requests in window
            pipe.zcard(rate_key)
            
            # Add current request
            request_id = f"{current_time}:{os.urandom(8).hex()}"
            pipe.zadd(rate_key, {request_id: current_time})
            
            # Set expiration
            pipe.expire(rate_key, window_seconds + 10)
            
            results = await pipe.execute()
            request_count = results[1]
            
            if request_count >= max_requests:
                # Get oldest request to calculate exact retry time
                oldest = await self._client.zrange(rate_key, 0, 0, withscores=True)
                if oldest:
                    oldest_time = float(oldest[0][1])
                    retry_after = int(oldest_time + window_seconds - current_time) + 1
                else:
                    retry_after = window_seconds
                
                return False, {
                    "allowed": False,
                    "remaining": 0,
                    "reset_at": int(current_time + retry_after),
                    "retry_after": max(retry_after, 1),
                    "limit": max_requests,
                    "window": window_seconds,
                    "current_usage": request_count
                }
            
            remaining = max_requests - request_count - 1
            return True, {
                "allowed": True,
                "remaining": max(remaining, 0),
                "reset_at": int(current_time + window_seconds),
                "retry_after": 0,
                "limit": max_requests,
                "window": window_seconds,
                "current_usage": request_count + 1
            }
        
        except Exception as e:
            logger.error(f"Sliding window error for {key}: {e}")
            # Fail open on error
            return True, {"allowed": True, "error": str(e)}
    
    async def get_window_requests(self, key: str, window_seconds: int) -> List[float]:
        """Get all request timestamps in current window."""
        await self.connect()
        
        current_time = time.time()
        window_start = current_time - window_seconds
        rate_key = f"sliding:window:{key}"
        
        try:
            requests = await self._client.zrangebyscore(
                rate_key,
                window_start,
                current_time,
                withscores=True
            )
            return [float(score) for _, score in requests]
        except Exception as e:
            logger.error(f"Error getting window requests: {e}")
            return []


class TokenBucketRateLimiter:
    """
    Token Bucket Algorithm - Allows controlled bursts while maintaining average rate.
    
    Perfect for APIs that need to allow occasional bursts without strict per-second limits.
    """
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self._client = redis_client
    
    async def connect(self):
        if not self._client:
            self._client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50,
            )
    
    async def check_limit(
        self,
        key: str,
        capacity: int,  # Maximum burst size
        refill_rate: float,  # Tokens per second
        cost: int = 1  # Cost of this request
    ) -> Tuple[bool, dict]:
        """
        Token bucket implementation with atomic operations.
        
        Args:
            key: Unique identifier
            capacity: Maximum tokens (burst capacity)
            refill_rate: Tokens added per second
            cost: Tokens consumed by this request
        """
        await self.connect()
        
        current_time = time.time()
        bucket_key = f"token:bucket:{key}"
        
        # Lua script for atomic token bucket operations
        lua_script = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local cost = tonumber(ARGV[3])
        local now = tonumber(ARGV[4])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now
        
        -- Refill tokens based on time passed
        local elapsed = now - last_refill
        local new_tokens = math.min(capacity, tokens + (elapsed * refill_rate))
        
        if new_tokens >= cost then
            -- Consume tokens
            new_tokens = new_tokens - cost
            redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
            redis.call('EXPIRE', key, 3600)
            return {1, new_tokens, capacity}
        else
            -- Not enough tokens
            redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
            redis.call('EXPIRE', key, 3600)
            return {0, new_tokens, capacity}
        end
        """
        
        try:
            result = await self._client.eval(
                lua_script,
                1,
                bucket_key,
                capacity,
                refill_rate,
                cost,
                current_time
            )
            
            allowed = bool(result[0])
            tokens_remaining = float(result[1])
            max_capacity = float(result[2])
            
            if not allowed:
                tokens_needed = cost - tokens_remaining
                retry_after = int(tokens_needed / refill_rate) + 1
                
                return False, {
                    "allowed": False,
                    "tokens_remaining": tokens_remaining,
                    "capacity": max_capacity,
                    "retry_after": retry_after,
                    "refill_rate": refill_rate
                }
            
            return True, {
                "allowed": True,
                "tokens_remaining": tokens_remaining,
                "capacity": max_capacity,
                "retry_after": 0,
                "refill_rate": refill_rate
            }
        
        except Exception as e:
            logger.error(f"Token bucket error: {e}")
            return True, {"allowed": True, "error": str(e)}


class AdaptiveRateLimiter:
    """
    Adaptive rate limiter that adjusts limits based on system load and user behavior.
    
    Features:
    - Automatically increases limits for well-behaved users
    - Reduces limits for abusive patterns
    - Considers system load metrics
    """
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self._client = redis_client
        self.sliding_window = SlidingWindowRateLimiter(redis_client)
    
    async def connect(self):
        if not self._client:
            self._client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50,
            )
            await self.sliding_window.connect()
    
    async def check_adaptive_limit(
        self,
        user_id: str,
        base_limit: int,
        window_seconds: int,
        system_load: float = 0.5  # 0.0 to 1.0
    ) -> Tuple[bool, dict]:
        """
        Check rate limit with adaptive adjustments.
        
        Args:
            user_id: User identifier
            base_limit: Base request limit
            window_seconds: Time window
            system_load: Current system load (0.0 = idle, 1.0 = overloaded)
        """
        await self.connect()
        
        # Get user reputation score
        reputation_key = f"user:reputation:{user_id}"
        reputation = await self._client.get(reputation_key)
        reputation_score = float(reputation) if reputation else 1.0
        
        # Adjust limit based on reputation and system load
        load_factor = 1.0 - (system_load * 0.5)  # Reduce up to 50% under load
        reputation_factor = min(reputation_score, 2.0)  # Max 2x boost
        
        adjusted_limit = int(base_limit * load_factor * reputation_factor)
        adjusted_limit = max(adjusted_limit, int(base_limit * 0.5))  # Min 50% of base
        
        # Use sliding window for actual check
        allowed, info = await self.sliding_window.check_limit(
            f"adaptive:{user_id}",
            adjusted_limit,
            window_seconds
        )
        
        # Update reputation based on behavior
        if allowed:
            # Good behavior - slowly increase reputation
            await self._increment_reputation(user_id, 0.01)
        else:
            # Rate limited - decrease reputation
            await self._increment_reputation(user_id, -0.05)
        
        info["adjusted_limit"] = adjusted_limit
        info["base_limit"] = base_limit
        info["reputation_score"] = reputation_score
        info["system_load"] = system_load
        
        return allowed, info
    
    async def _increment_reputation(self, user_id: str, delta: float):
        """Update user reputation score."""
        reputation_key = f"user:reputation:{user_id}"
        
        try:
            current = await self._client.get(reputation_key)
            score = float(current) if current else 1.0
            new_score = max(0.1, min(2.0, score + delta))  # Clamp between 0.1 and 2.0
            
            await self._client.setex(
                reputation_key,
                86400 * 30,  # 30 days
                str(new_score)
            )
        except Exception as e:
            logger.error(f"Error updating reputation: {e}")


# Global instances
sliding_window_limiter = SlidingWindowRateLimiter()
token_bucket_limiter = TokenBucketRateLimiter()
adaptive_limiter = AdaptiveRateLimiter()
