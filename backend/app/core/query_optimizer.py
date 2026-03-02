"""
Query Optimization Module with intelligent caching, memoization, and batching.
Optimizes database queries for high-concurrency scenarios.
"""
import asyncio
import hashlib
import json
from typing import Optional, Callable, Any, List, Dict, TypeVar, Coroutine
from functools import wraps
from datetime import datetime, timedelta
from collections import defaultdict
from loguru import logger
import time

from app.core.cache import cache, CacheStrategy

T = TypeVar('T')


class QueryOptimizer:
    """
    Advanced query optimization service with:
    - Automatic query result caching
    - Request coalescing (deduplication)
    - Batch query optimization
    - Predictive prefetching
    """
    
    def __init__(self):
        self._pending_queries: Dict[str, asyncio.Future] = {}
        self._query_stats: Dict[str, Dict] = defaultdict(lambda: {
            "count": 0,
            "total_time": 0.0,
            "cache_hits": 0,
            "cache_misses": 0
        })
        self._batch_queue: Dict[str, List] = defaultdict(list)
        self._batch_timers: Dict[str, asyncio.Task] = {}
    
    # ==================== Request Coalescing ====================
    
    async def coalesce_query(
        self,
        query_key: str,
        query_func: Callable[[], Coroutine[Any, Any, T]],
        ttl: int = 300
    ) -> T:
        """
        Coalesce duplicate concurrent queries.
        
        If the same query is requested multiple times concurrently,
        only execute it once and return the result to all requesters.
        
        Usage:
            result = await optimizer.coalesce_query(
                "user:123:profile",
                lambda: fetch_user_profile(123),
                ttl=600
            )
        """
        # Check cache first
        cached = await cache.get(query_key)
        if cached is not None:
            self._query_stats[query_key]["cache_hits"] += 1
            logger.debug(f"Query cache hit: {query_key}")
            return cached
        
        self._query_stats[query_key]["cache_misses"] += 1
        
        # Check if query is already pending
        if query_key in self._pending_queries:
            logger.debug(f"Query coalesced: {query_key}")
            return await self._pending_queries[query_key]
        
        # Create new query future
        future = asyncio.Future()
        self._pending_queries[query_key] = future
        
        try:
            start_time = time.perf_counter()
            result = await query_func()
            elapsed = time.perf_counter() - start_time
            
            # Update stats
            self._query_stats[query_key]["count"] += 1
            self._query_stats[query_key]["total_time"] += elapsed
            
            # Cache result
            await cache.set(query_key, result, ttl=ttl)
            
            # Resolve future
            future.set_result(result)
            
            logger.debug(f"Query executed: {query_key} ({elapsed:.3f}s)")
            return result
        
        except Exception as e:
            future.set_exception(e)
            raise
        
        finally:
            # Remove from pending
            self._pending_queries.pop(query_key, None)
    
    # ==================== Batch Query Optimization ====================
    
    async def batch_query(
        self,
        batch_key: str,
        item_id: str,
        batch_func: Callable[[List[str]], Coroutine[Any, Any, Dict[str, Any]]],
        max_batch_size: int = 100,
        max_wait_ms: int = 10
    ) -> Any:
        """
        Automatically batch multiple individual queries into a single batch request.
        
        Example:
            # Instead of N individual database queries
            user1 = await get_user(1)
            user2 = await get_user(2)
            user3 = await get_user(3)
            
            # Automatically batches into single query
            users = await fetch_users([1, 2, 3])
        
        Usage:
            result = await optimizer.batch_query(
                "users",  # batch key
                "123",    # item id
                fetch_users_batch,  # function that fetches multiple items
                max_batch_size=100,
                max_wait_ms=10
            )
        """
        # Create a future for this item
        future = asyncio.Future()
        
        # Add to batch queue
        self._batch_queue[batch_key].append((item_id, future))
        
        # Start batch timer if not running
        if batch_key not in self._batch_timers:
            self._batch_timers[batch_key] = asyncio.create_task(
                self._execute_batch(batch_key, batch_func, max_batch_size, max_wait_ms)
            )
        
        # If batch is full, execute immediately
        if len(self._batch_queue[batch_key]) >= max_batch_size:
            if batch_key in self._batch_timers:
                self._batch_timers[batch_key].cancel()
            await self._execute_batch_now(batch_key, batch_func)
        
        return await future
    
    async def _execute_batch(
        self,
        batch_key: str,
        batch_func: Callable,
        max_batch_size: int,
        max_wait_ms: int
    ):
        """Wait and execute batch."""
        try:
            await asyncio.sleep(max_wait_ms / 1000.0)
            await self._execute_batch_now(batch_key, batch_func)
        except asyncio.CancelledError:
            pass
        finally:
            self._batch_timers.pop(batch_key, None)
    
    async def _execute_batch_now(self, batch_key: str, batch_func: Callable):
        """Execute batch query immediately."""
        items = self._batch_queue.pop(batch_key, [])
        
        if not items:
            return
        
        item_ids = [item_id for item_id, _ in items]
        
        try:
            # Execute batch function
            results = await batch_func(item_ids)
            
            # Resolve all futures
            for item_id, future in items:
                if item_id in results:
                    future.set_result(results[item_id])
                else:
                    future.set_exception(KeyError(f"Item {item_id} not found in batch results"))
        
        except Exception as e:
            # Fail all futures
            for _, future in items:
                future.set_exception(e)
    
    # ==================== Predictive Prefetching ====================
    
    async def prefetch(
        self,
        keys: List[str],
        fetch_func: Callable[[str], Coroutine[Any, Any, Any]],
        ttl: int = 600
    ):
        """
        Predictively prefetch data that's likely to be requested soon.
        
        Usage:
            # After user requests profile, prefetch related data
            await optimizer.prefetch(
                ["user:123:posts", "user:123:followers"],
                fetch_user_data,
                ttl=300
            )
        """
        tasks = []
        
        for key in keys:
            # Check if already cached
            exists = await cache.exists(key)
            if not exists:
                task = asyncio.create_task(self._prefetch_single(key, fetch_func, ttl))
                tasks.append(task)
        
        if tasks:
            logger.info(f"Prefetching {len(tasks)} items")
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _prefetch_single(self, key: str, fetch_func: Callable, ttl: int):
        """Prefetch single item."""
        try:
            result = await fetch_func(key)
            await cache.set(key, result, ttl=ttl)
            logger.debug(f"Prefetched: {key}")
        except Exception as e:
            logger.warning(f"Prefetch failed for {key}: {e}")
    
    # ==================== Query Statistics ====================
    
    def get_query_stats(self) -> Dict[str, Dict]:
        """Get query performance statistics."""
        stats = {}
        
        for query_key, data in self._query_stats.items():
            if data["count"] > 0:
                avg_time = data["total_time"] / data["count"]
                total_requests = data["cache_hits"] + data["cache_misses"]
                hit_rate = (data["cache_hits"] / total_requests * 100) if total_requests > 0 else 0
                
                stats[query_key] = {
                    "executions": data["count"],
                    "avg_time_ms": round(avg_time * 1000, 2),
                    "total_time_ms": round(data["total_time"] * 1000, 2),
                    "cache_hit_rate": round(hit_rate, 1),
                    "cache_hits": data["cache_hits"],
                    "cache_misses": data["cache_misses"]
                }
        
        return stats
    
    def clear_stats(self):
        """Clear query statistics."""
        self._query_stats.clear()


# Global optimizer instance
query_optimizer = QueryOptimizer()


# ==================== Decorators ====================

def memoize(
    ttl: int = 3600,
    key_prefix: str = "",
    strategy: str = CacheStrategy.LRU
):
    """
    Memoization decorator with caching.
    
    Automatically caches function results based on arguments.
    Similar to Python's @lru_cache but works with async functions and uses Redis.
    
    Usage:
        @memoize(ttl=600, key_prefix="expensive_calc")
        async def expensive_calculation(x: int, y: int) -> int:
            await asyncio.sleep(1)  # Simulate expensive operation
            return x + y
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function and arguments
            key_parts = [key_prefix or f"memoize:{func.__name__}"]
            
            for arg in args:
                key_parts.append(str(arg))
            
            for k in sorted(kwargs.keys()):
                key_parts.append(f"{k}={kwargs[k]}")
            
            cache_key = ":".join(key_parts)
            
            # Check cache
            cached = await cache.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            await cache.set(cache_key, result, ttl=ttl, strategy=strategy)
            
            return result
        
        return wrapper
    return decorator


def query_coalescing(ttl: int = 300):
    """
    Decorator for request coalescing.
    
    Prevents duplicate concurrent queries by coalescing them into a single execution.
    
    Usage:
        @query_coalescing(ttl=600)
        async def get_user_profile(user_id: str) -> dict:
            return await db.fetch_one("SELECT * FROM users WHERE id = ?", user_id)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate query key
            key_parts = [func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            query_key = ":".join(key_parts)
            
            # Use query optimizer for coalescing
            return await query_optimizer.coalesce_query(
                query_key,
                lambda: func(*args, **kwargs),
                ttl=ttl
            )
        
        return wrapper
    return decorator


def auto_batch(
    batch_func_name: str,
    id_param: str = "id",
    max_batch_size: int = 100,
    max_wait_ms: int = 10
):
    """
    Decorator to automatically batch individual queries.
    
    Usage:
        @auto_batch("fetch_users_batch", id_param="user_id")
        async def get_user(user_id: str) -> dict:
            # This will be automatically batched
            pass
        
        async def fetch_users_batch(user_ids: List[str]) -> Dict[str, dict]:
            # Fetch all users in one query
            return {user.id: user for user in await db.fetch_all(...)}
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract ID from args/kwargs
            if id_param in kwargs:
                item_id = str(kwargs[id_param])
            elif args:
                item_id = str(args[0])
            else:
                raise ValueError(f"Could not find {id_param} in function arguments")
            
            # Get batch function
            batch_func = globals().get(batch_func_name)
            if not batch_func:
                raise ValueError(f"Batch function {batch_func_name} not found")
            
            # Use query optimizer for batching
            return await query_optimizer.batch_query(
                func.__name__,
                item_id,
                batch_func,
                max_batch_size=max_batch_size,
                max_wait_ms=max_wait_ms
            )
        
        return wrapper
    return decorator


# ==================== Connection Pooling Utilities ====================

class ConnectionPoolManager:
    """
    Manages connection pools for various services (database, Redis, HTTP clients).
    Ensures optimal connection reuse and prevents connection exhaustion.
    """
    
    def __init__(self):
        self._pools: Dict[str, Any] = {}
        self._pool_stats: Dict[str, Dict] = defaultdict(lambda: {
            "created": 0,
            "borrowed": 0,
            "returned": 0,
            "errors": 0
        })
    
    def register_pool(self, name: str, pool: Any):
        """Register a connection pool."""
        self._pools[name] = pool
        logger.info(f"Connection pool registered: {name}")
    
    def get_pool(self, name: str) -> Any:
        """Get a connection pool by name."""
        return self._pools.get(name)
    
    def get_stats(self) -> Dict[str, Dict]:
        """Get connection pool statistics."""
        return dict(self._pool_stats)
    
    async def close_all(self):
        """Close all connection pools."""
        for name, pool in self._pools.items():
            try:
                if hasattr(pool, 'close'):
                    await pool.close()
                logger.info(f"Connection pool closed: {name}")
            except Exception as e:
                logger.error(f"Error closing pool {name}: {e}")


# Global connection pool manager
pool_manager = ConnectionPoolManager()
