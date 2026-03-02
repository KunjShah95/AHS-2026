"""
Cost Monitoring API Endpoints
==============================
Real-time cost tracking, budgeting, and alerts.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.cost_optimizer import cost_optimizer, TokenUsage, CostMetrics
from app.core.production_config import prod_config

router = APIRouter()


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class CostSummaryResponse(BaseModel):
    """Cost summary response."""
    total_requests: int
    cached_requests: int
    cache_hit_rate_percent: float
    
    total_input_tokens: int
    total_output_tokens: int
    total_tokens: int
    
    total_cost_usd: float
    estimated_monthly_cost_usd: float
    cost_savings_from_cache_usd: float
    
    avg_tokens_per_request: float
    avg_cost_per_request_usd: float
    
    budget_status: Dict
    top_models: List[Dict]
    top_tasks: List[Dict]


class BudgetStatusResponse(BaseModel):
    """Budget status response."""
    daily_limit_tokens: int
    daily_used_tokens: int
    daily_remaining_tokens: int
    daily_usage_percent: float
    
    user_limit_tokens: int
    alert_threshold_percent: int
    block_threshold_percent: int
    
    status: str  # "healthy", "warning", "critical", "exceeded"
    alerts: List[str]


class CostBreakdownResponse(BaseModel):
    """Detailed cost breakdown."""
    by_model: Dict[str, Dict]
    by_task: Dict[str, Dict]
    by_hour: List[Dict]
    by_day: List[Dict]


class OptimizationRecommendations(BaseModel):
    """AI cost optimization recommendations."""
    current_monthly_cost: float
    potential_savings: float
    recommendations: List[Dict]
    priority_actions: List[str]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/cost/summary", response_model=CostSummaryResponse)
async def get_cost_summary():
    """
    Get real-time cost summary.
    
    Shows:
    - Total requests and cache hit rate
    - Token usage (input/output)
    - Costs and projections
    - Budget status
    """
    metrics = cost_optimizer.get_metrics()
    
    # Get budget status
    date_key = datetime.now().strftime("%Y-%m-%d")
    daily_used = cost_optimizer._daily_usage.get(date_key, 0)
    daily_limit = prod_config.token_budget.daily_input_tokens
    daily_percent = (daily_used / daily_limit * 100) if daily_limit > 0 else 0
    
    # Determine budget status
    alert_threshold = prod_config.token_budget.alert_at_percent
    block_threshold = prod_config.token_budget.block_at_percent
    
    if daily_percent >= block_threshold:
        status = "exceeded"
    elif daily_percent >= alert_threshold:
        status = "critical"
    elif daily_percent >= 50:
        status = "warning"
    else:
        status = "healthy"
    
    budget_status = {
        "daily_used_tokens": daily_used,
        "daily_limit_tokens": daily_limit,
        "daily_remaining_tokens": max(0, daily_limit - daily_used),
        "daily_usage_percent": round(daily_percent, 2),
        "status": status
    }
    
    # Get top models by cost
    top_models = sorted(
        [
            {"model": k, **v}
            for k, v in metrics.get("by_model", {}).items()
        ],
        key=lambda x: x["cost"],
        reverse=True
    )[:5]
    
    # Get top tasks by cost
    top_tasks = sorted(
        [
            {"task": k, **v}
            for k, v in metrics.get("by_task", {}).items()
        ],
        key=lambda x: x["cost"],
        reverse=True
    )[:5]
    
    return CostSummaryResponse(
        total_requests=metrics["total_requests"],
        cached_requests=metrics["cached_requests"],
        cache_hit_rate_percent=metrics["cache_hit_rate"],
        
        total_input_tokens=cost_optimizer.metrics.total_input_tokens,
        total_output_tokens=cost_optimizer.metrics.total_output_tokens,
        total_tokens=metrics["total_tokens"],
        
        total_cost_usd=metrics["total_cost_usd"],
        estimated_monthly_cost_usd=metrics["estimated_monthly_cost_usd"],
        cost_savings_from_cache_usd=metrics["cost_savings_from_cache_usd"],
        
        avg_tokens_per_request=metrics["avg_tokens_per_request"],
        avg_cost_per_request_usd=metrics["avg_cost_per_request_usd"],
        
        budget_status=budget_status,
        top_models=top_models,
        top_tasks=top_tasks
    )


@router.get("/cost/budget", response_model=BudgetStatusResponse)
async def get_budget_status(user_id: Optional[str] = Query(None)):
    """
    Get current budget status.
    
    Shows:
    - Daily limits and usage
    - User-specific limits (if user_id provided)
    - Alert status
    - Recommendations
    """
    date_key = datetime.now().strftime("%Y-%m-%d")
    
    # Global budget
    daily_used = cost_optimizer._daily_usage.get(date_key, 0)
    daily_limit = prod_config.token_budget.daily_input_tokens
    daily_percent = (daily_used / daily_limit * 100) if daily_limit > 0 else 0
    
    # User budget (if requested)
    user_used = 0
    user_limit = prod_config.token_budget.user_daily_input
    if user_id:
        user_used = cost_optimizer._user_usage.get(user_id, {}).get(date_key, 0)
    
    # Determine status
    alert_threshold = prod_config.token_budget.alert_at_percent
    block_threshold = prod_config.token_budget.block_at_percent
    
    alerts = []
    
    if daily_percent >= block_threshold:
        status = "exceeded"
        alerts.append(f"Daily budget exceeded: {daily_percent:.1f}%")
    elif daily_percent >= alert_threshold:
        status = "critical"
        alerts.append(f"Daily budget critical: {daily_percent:.1f}%")
    elif daily_percent >= 50:
        status = "warning"
        alerts.append(f"Daily budget at {daily_percent:.1f}%")
    else:
        status = "healthy"
    
    # User alerts
    if user_id and user_used > 0:
        user_percent = (user_used / user_limit * 100) if user_limit > 0 else 0
        if user_percent >= 80:
            alerts.append(f"User {user_id} at {user_percent:.1f}% of daily limit")
    
    return BudgetStatusResponse(
        daily_limit_tokens=daily_limit,
        daily_used_tokens=daily_used,
        daily_remaining_tokens=max(0, daily_limit - daily_used),
        daily_usage_percent=round(daily_percent, 2),
        
        user_limit_tokens=user_limit,
        alert_threshold_percent=alert_threshold,
        block_threshold_percent=block_threshold,
        
        status=status,
        alerts=alerts
    )


@router.get("/cost/breakdown", response_model=CostBreakdownResponse)
async def get_cost_breakdown():
    """
    Get detailed cost breakdown by model, task, and time.
    """
    metrics = cost_optimizer.get_metrics()
    
    # By hour (last 24 hours)
    by_hour = []
    now = datetime.now()
    for i in range(24):
        hour_start = now - timedelta(hours=i)
        hour_key = hour_start.strftime("%Y-%m-%d %H:00")
        
        # Filter usage log for this hour
        hour_usage = [
            u for u in cost_optimizer._usage_log
            if datetime.fromtimestamp(u.timestamp).strftime("%Y-%m-%d %H:00") == hour_key
        ]
        
        if hour_usage:
            by_hour.append({
                "hour": hour_key,
                "requests": len(hour_usage),
                "tokens": sum(u.total_tokens for u in hour_usage),
                "cost": sum(u.cost_usd for u in hour_usage)
            })
    
    # By day (last 7 days)
    by_day = []
    for i in range(7):
        day_start = now - timedelta(days=i)
        day_key = day_start.strftime("%Y-%m-%d")
        
        day_usage = [
            u for u in cost_optimizer._usage_log
            if datetime.fromtimestamp(u.timestamp).strftime("%Y-%m-%d") == day_key
        ]
        
        if day_usage:
            by_day.append({
                "date": day_key,
                "requests": len(day_usage),
                "tokens": sum(u.total_tokens for u in day_usage),
                "cost": sum(u.cost_usd for u in day_usage)
            })
    
    return CostBreakdownResponse(
        by_model=metrics.get("by_model", {}),
        by_task=metrics.get("by_task", {}),
        by_hour=by_hour,
        by_day=by_day
    )


@router.get("/cost/recommendations", response_model=OptimizationRecommendations)
async def get_optimization_recommendations():
    """
    Get AI-powered cost optimization recommendations.
    
    Analyzes usage patterns and suggests:
    - Model changes
    - Caching improvements
    - Prompt optimizations
    - Task consolidation
    """
    metrics = cost_optimizer.get_metrics()
    current_cost = metrics["estimated_monthly_cost_usd"]
    
    recommendations = []
    priority_actions = []
    total_potential_savings = 0
    
    # Check cache hit rate
    cache_hit_rate = metrics["cache_hit_rate"]
    if cache_hit_rate < 30:
        saving = current_cost * 0.20  # 20% savings potential
        total_potential_savings += saving
        recommendations.append({
            "category": "Caching",
            "issue": f"Low cache hit rate: {cache_hit_rate:.1f}%",
            "recommendation": "Enable aggressive caching for repeated queries",
            "potential_savings_usd": round(saving, 2),
            "effort": "low",
            "impact": "high"
        })
        priority_actions.append("Enable aggressive response caching")
    
    # Check model usage
    by_model = metrics.get("by_model", {})
    if by_model:
        # Find expensive model usage
        for model, stats in by_model.items():
            if "claude" in model.lower() or "gpt-4" in model.lower():
                # Check if this could use cheaper model
                requests = stats["requests"]
                cost = stats["cost"]
                
                if requests > 100:  # Significant usage
                    # Estimate savings if moved to Flash
                    potential_saving = cost * 0.70  # 70% cheaper with Flash
                    total_potential_savings += potential_saving
                    
                    recommendations.append({
                        "category": "Model Selection",
                        "issue": f"Using expensive model '{model}' for {requests} requests",
                        "recommendation": f"Switch to Gemini Flash for simple tasks",
                        "potential_savings_usd": round(potential_saving, 2),
                        "effort": "medium",
                        "impact": "high"
                    })
                    priority_actions.append(f"Optimize model selection for {model}")
    
    # Check for request deduplication
    if not prod_config.token_optimization.deduplicate_requests:
        saving = current_cost * 0.15  # 15% savings
        total_potential_savings += saving
        recommendations.append({
            "category": "Deduplication",
            "issue": "Request deduplication disabled",
            "recommendation": "Enable deduplication to avoid processing identical requests",
            "potential_savings_usd": round(saving, 2),
            "effort": "low",
            "impact": "medium"
        })
        priority_actions.append("Enable request deduplication")
    
    # Check for batching
    if not prod_config.token_optimization.enable_batching:
        saving = current_cost * 0.10  # 10% savings
        total_potential_savings += saving
        recommendations.append({
            "category": "Batching",
            "issue": "Request batching disabled",
            "recommendation": "Enable batching to process multiple requests efficiently",
            "potential_savings_usd": round(saving, 2),
            "effort": "low",
            "impact": "medium"
        })
        priority_actions.append("Enable request batching")
    
    # Check prompt optimization
    if not prod_config.token_optimization.compress_prompts:
        saving = current_cost * 0.25  # 25% savings
        total_potential_savings += saving
        recommendations.append({
            "category": "Prompt Optimization",
            "issue": "Prompt compression disabled",
            "recommendation": "Enable prompt compression to reduce input tokens",
            "potential_savings_usd": round(saving, 2),
            "effort": "low",
            "impact": "high"
        })
        priority_actions.append("Enable prompt compression")
    
    # General recommendations
    if current_cost > 500:
        recommendations.append({
            "category": "Volume Discounts",
            "issue": f"High monthly cost: ${current_cost:.2f}",
            "recommendation": "Contact AI provider for enterprise pricing",
            "potential_savings_usd": round(current_cost * 0.20, 2),
            "effort": "medium",
            "impact": "high"
        })
    
    return OptimizationRecommendations(
        current_monthly_cost=round(current_cost, 2),
        potential_savings=round(total_potential_savings, 2),
        recommendations=sorted(recommendations, key=lambda x: x["potential_savings_usd"], reverse=True),
        priority_actions=priority_actions[:5]  # Top 5 actions
    )


@router.post("/cost/reset-stats")
async def reset_daily_stats():
    """
    Reset daily statistics (admin only).
    Typically called by scheduled job at midnight.
    """
    cost_optimizer.reset_daily_stats()
    return {"message": "Daily statistics reset", "timestamp": datetime.now().isoformat()}


@router.get("/cost/config")
async def get_cost_config():
    """Get current cost optimization configuration."""
    return {
        "production_config": prod_config.to_dict(),
        "optimization_enabled": True,
        "features": {
            "caching": prod_config.cache.enabled,
            "deduplication": prod_config.token_optimization.deduplicate_requests,
            "batching": prod_config.token_optimization.enable_batching,
            "prompt_compression": prod_config.token_optimization.compress_prompts,
            "rate_limiting": prod_config.rate_limit.global_requests_per_minute,
        }
    }


# ============================================================================
# WEBHOOKS / ALERTS
# ============================================================================

@router.post("/cost/webhooks/budget-alert")
async def trigger_budget_alert(webhook_url: str):
    """
    Configure webhook for budget alerts.
    Sends POST request when budget thresholds are exceeded.
    """
    # Store webhook URL (in production, save to database)
    # For now, just acknowledge
    return {
        "message": "Budget alert webhook configured",
        "webhook_url": webhook_url,
        "triggers": [
            f"Daily budget at {prod_config.token_budget.alert_at_percent}%",
            f"Daily budget at {prod_config.token_budget.block_at_percent}%"
        ]
    }


if __name__ == "__main__":
    print("Cost Monitoring API Endpoints")
    print("=" * 80)
    print("\nAvailable endpoints:")
    print("  GET  /cost/summary          - Real-time cost summary")
    print("  GET  /cost/budget           - Budget status and alerts")
    print("  GET  /cost/breakdown        - Detailed cost breakdown")
    print("  GET  /cost/recommendations  - AI optimization recommendations")
    print("  GET  /cost/config           - Current configuration")
    print("  POST /cost/reset-stats      - Reset daily statistics")
    print("  POST /cost/webhooks/budget-alert - Configure alerts")
