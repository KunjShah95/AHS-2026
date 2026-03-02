"""
Example: Integrating scaling features into CodeFlow API endpoints.
This shows how to use caching, rate limiting, and query optimization.
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from loguru import logger

# Import our scaling modules
from app.core.cache import cached, cache_invalidate, cache
from app.core.advanced_rate_limiting import sliding_window_limiter, adaptive_limiter
from app.core.query_optimizer import memoize, query_coalescing, query_optimizer
from app.core.rate_limiter import RateLimitTier

router = APIRouter()


# ==========================================
# Example 1: Cached Repository Analysis
# ==========================================

@router.get("/repository/{repo_id}/analysis")
@cached(ttl=1800, key_prefix="repo_analysis")  # Cache for 30 minutes
async def get_repository_analysis(repo_id: str, request: Request):
    """
    Get repository analysis with automatic caching.
    
    First request: fetches from database/computes analysis (slow)
    Subsequent requests: returns cached result (fast)
    """
    # Rate limit check with sliding window
    user_id = request.state.get("user_id", "anonymous")
    allowed, info = await sliding_window_limiter.check_limit(
        key=f"user:{user_id}:repo_analysis",
        max_requests=50,  # 50 requests
        window_seconds=300  # per 5 minutes
    )
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry after {info['retry_after']} seconds",
            headers={
                "Retry-After": str(info["retry_after"]),
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Reset": str(info["reset_at"])
            }
        )
    
    logger.info(f"Analyzing repository {repo_id}")
    
    # Expensive operation (will be cached)
    analysis = await perform_repository_analysis(repo_id)
    
    return {
        "repo_id": repo_id,
        "analysis": analysis,
        "cache_info": {
            "cached": False,  # First time
            "ttl": 1800
        },
        "rate_limit": info
    }


@router.post("/repository/{repo_id}/update")
@cache_invalidate(key_prefix="repo_analysis")
async def update_repository(repo_id: str, data: Dict[str, Any]):
    """
    Update repository and invalidate cache.
    
    Automatically clears all cached repository analysis.
    """
    # Update repository
    await update_repository_data(repo_id, data)
    
    # Cache is automatically invalidated by decorator
    return {"status": "updated", "repo_id": repo_id}


# ==========================================
# Example 2: Adaptive Rate Limiting
# ==========================================

@router.get("/api/heavy-computation")
async def heavy_computation_endpoint(request: Request):
    """
    Endpoint with adaptive rate limiting.
    
    - Good users get higher limits
    - System load affects limits
    - Prevents abuse while allowing legitimate bursts
    """
    user_id = request.state.get("user_id", "anonymous")
    
    # Simulate system load (in production, get from monitoring)
    system_load = 0.3  # 30% load = plenty of capacity
    
    allowed, info = await adaptive_limiter.check_adaptive_limit(
        user_id=user_id,
        base_limit=100,  # Base 100 req/min
        window_seconds=60,
        system_load=system_load
    )
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "retry_after": info["retry_after"],
                "base_limit": info["base_limit"],
                "adjusted_limit": info["adjusted_limit"],
                "reputation_score": info["reputation_score"]
            }
        )
    
    # Perform heavy computation
    result = await expensive_computation()
    
    return {
        "result": result,
        "rate_limit_info": {
            "remaining": info["remaining"],
            "limit": info["adjusted_limit"],
            "base_limit": info["base_limit"],
            "reputation": info["reputation_score"]
        }
    }


# ==========================================
# Example 3: Query Coalescing
# ==========================================

@memoize(ttl=600, key_prefix="user_profile")
async def get_user_profile(user_id: str) -> Dict[str, Any]:
    """
    Get user profile with automatic memoization.
    
    If called multiple times with same user_id, executes once
    and returns cached result to all callers.
    """
    logger.info(f"Fetching user profile from database: {user_id}")
    
    # Simulate database query
    import asyncio
    await asyncio.sleep(0.1)
    
    return {
        "user_id": user_id,
        "name": f"User {user_id}",
        "email": f"user{user_id}@example.com",
        "preferences": {"theme": "dark", "language": "en"}
    }


@query_coalescing(ttl=300)
async def get_repository_stats(repo_id: str) -> Dict[str, Any]:
    """
    Get repository statistics with request coalescing.
    
    If multiple requests come in simultaneously for the same repo,
    only one database query is executed.
    """
    logger.info(f"Fetching repository stats from database: {repo_id}")
    
    # Simulate database query
    import asyncio
    await asyncio.sleep(0.2)
    
    return {
        "repo_id": repo_id,
        "stars": 1234,
        "forks": 567,
        "contributors": 89,
        "last_commit": "2026-03-01T10:00:00Z"
    }


@router.get("/user/{user_id}/dashboard")
async def get_user_dashboard(user_id: str, request: Request):
    """
    Get user dashboard with smart query optimization.
    
    Uses:
    - Memoization for frequently accessed data
    - Request coalescing for concurrent requests
    - Predictive prefetching for related data
    """
    # These will be coalesced if called simultaneously
    user_profile = await get_user_profile(user_id)
    
    # After getting profile, predictively prefetch related data
    await query_optimizer.prefetch(
        keys=[
            f"user:{user_id}:recent_activity",
            f"user:{user_id}:notifications",
            f"user:{user_id}:repositories"
        ],
        fetch_func=lambda key: fetch_user_related_data(key),
        ttl=300
    )
    
    return {
        "user": user_profile,
        "message": "Related data prefetched in background"
    }


# ==========================================
# Example 4: Multi-tier Rate Limiting
# ==========================================

@router.post("/api/analyze-code")
async def analyze_code_endpoint(request: Request, code: Dict[str, Any]):
    """
    Code analysis endpoint with multi-tier rate limiting.
    
    Enforces limits at multiple levels:
    - Per user: 100 req/min
    - Per IP: 1000 req/min
    - Per endpoint: 10000 req/min
    """
    from app.core.advanced_rate_limiting import sliding_window_limiter
    
    user_id = request.state.get("user_id", "anonymous")
    client_ip = request.client.host if request.client else "unknown"
    
    # Check user limit
    user_allowed, user_info = await sliding_window_limiter.check_limit(
        f"user:{user_id}:analyze",
        max_requests=100,
        window_seconds=60
    )
    
    if not user_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"User rate limit exceeded. Retry after {user_info['retry_after']}s"
        )
    
    # Check IP limit (higher threshold)
    ip_allowed, ip_info = await sliding_window_limiter.check_limit(
        f"ip:{client_ip}:analyze",
        max_requests=1000,
        window_seconds=60
    )
    
    if not ip_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"IP rate limit exceeded. Retry after {ip_info['retry_after']}s"
        )
    
    # Check global endpoint limit
    endpoint_allowed, endpoint_info = await sliding_window_limiter.check_limit(
        "endpoint:analyze",
        max_requests=10000,
        window_seconds=60
    )
    
    if not endpoint_allowed:
        raise HTTPException(
            status_code=503,
            detail="Service temporarily overloaded. Please try again later."
        )
    
    # Perform code analysis
    result = await analyze_code_logic(code)
    
    return {
        "analysis": result,
        "rate_limits": {
            "user": {"remaining": user_info["remaining"], "limit": user_info["limit"]},
            "ip": {"remaining": ip_info["remaining"], "limit": ip_info["limit"]},
            "endpoint": {"remaining": endpoint_info["remaining"], "limit": endpoint_info["limit"]}
        }
    }


# ==========================================
# Example 5: Batch Query Optimization
# ==========================================

async def fetch_users_batch(user_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Batch function to fetch multiple users in one query.
    
    Instead of N database queries, this makes 1 query.
    """
    logger.info(f"Batch fetching {len(user_ids)} users")
    
    # Simulate batch database query
    import asyncio
    await asyncio.sleep(0.1)
    
    return {
        user_id: {
            "user_id": user_id,
            "name": f"User {user_id}",
            "email": f"user{user_id}@example.com"
        }
        for user_id in user_ids
    }


@router.get("/team/{team_id}/members")
async def get_team_members(team_id: str):
    """
    Get team members with automatic query batching.
    
    If multiple individual user queries come in quickly,
    they're automatically batched into a single database query.
    """
    # Get team member IDs
    member_ids = await get_team_member_ids(team_id)
    
    # Batch fetch all members (automatically optimized)
    members = []
    for user_id in member_ids:
        # These will be automatically batched by query_optimizer
        user = await query_optimizer.batch_query(
            batch_key="users",
            item_id=user_id,
            batch_func=fetch_users_batch,
            max_batch_size=50,
            max_wait_ms=10
        )
        members.append(user)
    
    return {
        "team_id": team_id,
        "members": members,
        "count": len(members)
    }


# ==========================================
# Example 6: Distributed Locking
# ==========================================

@router.post("/repository/{repo_id}/clone")
async def clone_repository(repo_id: str):
    """
    Clone repository with distributed locking.
    
    Prevents multiple concurrent clones of the same repository
    across different server instances.
    """
    lock_key = f"clone:{repo_id}"
    
    # Try to acquire lock
    lock_token = await cache.acquire_lock(
        lock_key,
        timeout=300,  # 5 minute timeout
        retry_times=3,
        retry_delay=0.5
    )
    
    if not lock_token:
        raise HTTPException(
            status_code=409,
            detail=f"Repository {repo_id} is already being cloned. Please try again later."
        )
    
    try:
        # Perform clone operation
        logger.info(f"Cloning repository {repo_id}")
        result = await clone_repository_logic(repo_id)
        
        return {
            "status": "success",
            "repo_id": repo_id,
            "result": result
        }
    
    finally:
        # Always release lock
        await cache.release_lock(lock_key, lock_token)


# ==========================================
# Helper Functions (Mock implementations)
# ==========================================

async def perform_repository_analysis(repo_id: str) -> Dict[str, Any]:
    """Mock expensive repository analysis."""
    import asyncio
    await asyncio.sleep(0.5)  # Simulate expensive operation
    return {
        "complexity_score": 7.5,
        "test_coverage": 85.3,
        "code_quality": "A",
        "security_issues": 2
    }


async def update_repository_data(repo_id: str, data: Dict[str, Any]):
    """Mock repository update."""
    import asyncio
    await asyncio.sleep(0.1)


async def expensive_computation() -> Dict[str, Any]:
    """Mock expensive computation."""
    import asyncio
    await asyncio.sleep(0.3)
    return {"result": "computed", "value": 42}


async def fetch_user_related_data(key: str) -> Dict[str, Any]:
    """Mock fetching related user data."""
    import asyncio
    await asyncio.sleep(0.1)
    return {"key": key, "data": "prefetched"}


async def analyze_code_logic(code: Dict[str, Any]) -> Dict[str, Any]:
    """Mock code analysis."""
    import asyncio
    await asyncio.sleep(0.2)
    return {"issues": [], "suggestions": ["Use type hints"], "score": 8.5}


async def get_team_member_ids(team_id: str) -> List[str]:
    """Mock getting team member IDs."""
    return [f"user{i}" for i in range(1, 6)]


async def clone_repository_logic(repo_id: str) -> Dict[str, Any]:
    """Mock repository cloning."""
    import asyncio
    await asyncio.sleep(2.0)  # Simulate long operation
    return {"status": "cloned", "path": f"/repos/{repo_id}"}
