"""
AI Cost Tracking API

Endpoints for monitoring AI usage and costs across all providers.

Features:
- Real-time cost tracking
- Provider comparison
- Budget management
- Usage analytics
- Cost optimization insights
"""

from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.ai_cost_tracker import get_cost_tracker
from app.core.security import get_current_user
from app.models.sqlalchemy_models import User


router = APIRouter(prefix="/ai-costs", tags=["AI Cost Tracking"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CostSummaryResponse(BaseModel):
    """Daily/monthly cost summary."""
    daily_cost: float = Field(description="Total cost for today")
    monthly_cost: float = Field(description="Total cost for current month")
    currency: str = "USD"


class ProviderCostBreakdown(BaseModel):
    """Cost breakdown by provider."""
    provider: str
    cost: float
    requests: int = 0
    percentage: float = 0.0


class ModelCostBreakdown(BaseModel):
    """Cost breakdown by model."""
    model: str
    cost: float
    requests: int = 0
    percentage: float = 0.0
    provider: str


class RequestStatsResponse(BaseModel):
    """Comprehensive request statistics."""
    total_requests: int
    total_tokens: int
    total_cost: float
    avg_cost_per_request: float
    avg_latency_ms: float
    success_rate: float
    most_used_model: Optional[str]
    most_used_provider: Optional[str]


class BudgetStatusResponse(BaseModel):
    """Budget status."""
    within_budget: bool
    spent: float
    budget: Optional[float]
    remaining: Optional[float]
    percentage_used: Optional[float]
    alert_level: str = Field(description="ok, warning, or over_limit")


class SetBudgetRequest(BaseModel):
    """Set a cost budget."""
    amount: float = Field(gt=0, description="Budget amount in USD")
    period: str = Field(default="monthly", description="monthly, weekly, or daily")
    warning_threshold: float = Field(default=0.8, ge=0, le=1, description="Alert at this percentage")
    enforce_limit: bool = Field(default=False, description="Block requests if over budget")


# ============================================================================
# COST SUMMARY ENDPOINTS
# ============================================================================

@router.get("/summary", response_model=CostSummaryResponse)
async def get_cost_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cost summary for current user.
    
    Returns daily and monthly costs.
    """
    
    tracker = get_cost_tracker()
    
    daily_cost = await tracker.get_daily_cost(user_id=user.id)
    monthly_cost = await tracker.get_monthly_cost(user_id=user.id)
    
    return CostSummaryResponse(
        daily_cost=daily_cost,
        monthly_cost=monthly_cost
    )


@router.get("/daily", response_model=Dict[str, float])
async def get_daily_costs(
    days: int = Query(default=7, ge=1, le=365, description="Number of days to retrieve"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily costs for the past N days.
    
    Returns:
        {date: cost, ...}
    """
    
    tracker = get_cost_tracker()
    
    daily_costs = {}
    for i in range(days):
        target_date = datetime.utcnow().date() - timedelta(days=i)
        cost = await tracker.get_daily_cost(user_id=user.id, date=target_date)
        daily_costs[str(target_date)] = cost
    
    return daily_costs


# ============================================================================
# PROVIDER & MODEL ANALYTICS
# ============================================================================

@router.get("/by-provider", response_model=List[ProviderCostBreakdown])
async def get_cost_by_provider(
    days: int = Query(default=30, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cost breakdown by AI provider.
    
    Shows which providers are costing the most.
    """
    
    tracker = get_cost_tracker()
    
    provider_costs = await tracker.get_cost_by_provider(
        user_id=user.id,
        start_date=datetime.utcnow() - timedelta(days=days),
        end_date=datetime.utcnow()
    )
    
    total_cost = sum(provider_costs.values())
    
    breakdown = []
    for provider, cost in provider_costs.items():
        percentage = (cost / total_cost * 100) if total_cost > 0 else 0
        breakdown.append(ProviderCostBreakdown(
            provider=provider,
            cost=cost,
            percentage=percentage
        ))
    
    # Sort by cost descending
    breakdown.sort(key=lambda x: x.cost, reverse=True)
    
    return breakdown


@router.get("/by-model", response_model=List[ModelCostBreakdown])
async def get_cost_by_model(
    limit: int = Query(default=10, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get top models by cost.
    
    Shows which AI models are most expensive.
    """
    
    tracker = get_cost_tracker()
    
    model_costs = await tracker.get_cost_by_model(user_id=user.id, limit=limit)
    
    total_cost = sum(model_costs.values())
    
    breakdown = []
    for model, cost in model_costs.items():
        percentage = (cost / total_cost * 100) if total_cost > 0 else 0
        # Extract provider from model name if possible
        provider = model.split('/')[0] if '/' in model else "unknown"
        breakdown.append(ModelCostBreakdown(
            model=model,
            cost=cost,
            percentage=percentage,
            provider=provider
        ))
    
    return breakdown


@router.get("/by-task", response_model=Dict[str, float])
async def get_cost_by_task(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cost breakdown by task type.
    
    Shows which tasks (code review, generation, etc) cost the most.
    """
    
    tracker = get_cost_tracker()
    
    task_costs = await tracker.get_cost_by_task(user_id=user.id)
    
    return task_costs


# ============================================================================
# USAGE STATISTICS
# ============================================================================

@router.get("/stats", response_model=RequestStatsResponse)
async def get_request_stats(
    days: int = Query(default=30, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive request statistics.
    
    Includes token usage, costs, latency, success rate, and more.
    """
    
    tracker = get_cost_tracker()
    
    stats = await tracker.get_request_stats(user_id=user.id, days=days)
    
    return RequestStatsResponse(**stats)


# ============================================================================
# BUDGET MANAGEMENT
# ============================================================================

@router.get("/budget", response_model=BudgetStatusResponse)
async def get_budget_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check current budget status.
    
    Returns whether user is within budget and remaining amount.
    """
    
    tracker = get_cost_tracker()
    
    budget_status = await tracker.check_budget(user_id=user.id)
    
    return BudgetStatusResponse(**budget_status)


@router.post("/budget")
async def set_budget(
    request: SetBudgetRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Set a cost budget.
    
    Can set monthly, weekly, or daily budgets with optional alerts.
    """
    
    tracker = get_cost_tracker()
    
    budget_id = await tracker.set_budget(
        user_id=user.id,
        amount=request.amount,
        period=request.period,
        warning_threshold=request.warning_threshold,
        enforce_limit=request.enforce_limit
    )
    
    return {
        "status": "success",
        "budget_id": str(budget_id),
        "message": f"Budget of ${request.amount} set for {request.period} period"
    }


# ============================================================================
# COST OPTIMIZATION INSIGHTS
# ============================================================================

@router.get("/optimization-insights")
async def get_optimization_insights(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cost optimization recommendations.
    
    Analyzes usage patterns and suggests ways to reduce costs.
    """
    
    tracker = get_cost_tracker()
    
    # Get usage stats
    stats = await tracker.get_request_stats(user_id=user.id, days=30)
    provider_costs = await tracker.get_cost_by_provider(user_id=user.id)
    model_costs = await tracker.get_cost_by_model(user_id=user.id, limit=5)
    
    insights = []
    
    # Insight 1: Expensive models
    if model_costs:
        most_expensive = max(model_costs.items(), key=lambda x: x[1])
        if most_expensive[1] > stats['total_cost'] * 0.5:
            insights.append({
                "type": "expensive_model",
                "severity": "high",
                "message": f"Model '{most_expensive[0]}' accounts for >50% of costs",
                "recommendation": "Consider using cheaper alternatives like DeepSeek or Groq for non-critical tasks",
                "potential_savings": most_expensive[1] * 0.7  # Could save 70% with cheaper model
            })
    
    # Insight 2: Provider optimization
    if provider_costs.get('openai', 0) > stats['total_cost'] * 0.7:
        insights.append({
            "type": "provider_optimization",
            "severity": "medium",
            "message": "OpenAI accounts for >70% of costs",
            "recommendation": "Try using Anthropic Claude Haiku ($0.25/1M) or DeepSeek ($0.014/1M) for simpler tasks",
            "potential_savings": provider_costs['openai'] * 0.5
        })
    
    # Insight 3: High volume tasks
    task_costs = await tracker.get_cost_by_task(user_id=user.id)
    if task_costs:
        most_expensive_task = max(task_costs.items(), key=lambda x: x[1])
        if most_expensive_task[1] > stats['total_cost'] * 0.4:
            insights.append({
                "type": "task_optimization",
                "severity": "medium",
                "message": f"Task type '{most_expensive_task[0]}' is most expensive",
                "recommendation": "Consider caching responses or using cheaper models for this task type",
                "potential_savings": most_expensive_task[1] * 0.3
            })
    
    # Insight 4: Budget recommendation
    monthly_cost = await tracker.get_monthly_cost(user_id=user.id)
    if monthly_cost > 50:
        insights.append({
            "type": "budget_alert",
            "severity": "info",
            "message": f"Monthly cost is ${monthly_cost:.2f}",
            "recommendation": "Consider setting a budget to get alerts before overspending",
            "potential_savings": 0
        })
    
    return {
        "total_cost_30d": stats['total_cost'],
        "insights": insights,
        "total_potential_savings": sum(insight.get('potential_savings', 0) for insight in insights)
    }


# ============================================================================
# ADMIN ENDPOINTS (for organization-level analytics)
# ============================================================================

@router.get("/admin/org-costs")
async def get_organization_costs(
    organization_id: UUID,
    days: int = Query(default=30, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get organization-wide cost summary.
    
    Requires admin role.
    """
    
    # TODO: Add role check for admin
    if user.role != "admin" and user.role != "org_admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    tracker = get_cost_tracker()
    
    # Get all costs for organization
    from app.models.sqlalchemy_models import AIRequest
    from sqlalchemy import func
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    total_cost = db.query(func.sum(AIRequest.actual_cost)).join(
        User
    ).filter(
        User.organization_id == organization_id,
        AIRequest.created_at >= start_date,
        AIRequest.status == "completed"
    ).scalar() or 0.0
    
    total_requests = db.query(func.count(AIRequest.id)).join(
        User
    ).filter(
        User.organization_id == organization_id,
        AIRequest.created_at >= start_date
    ).scalar() or 0
    
    return {
        "organization_id": str(organization_id),
        "period_days": days,
        "total_cost": float(total_cost),
        "total_requests": total_requests,
        "avg_cost_per_request": float(total_cost / total_requests) if total_requests > 0 else 0.0
    }
