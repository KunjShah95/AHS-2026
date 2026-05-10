"""
AI Cost Tracking Service

Automatically tracks and logs all AI requests for cost monitoring, analytics, and budgeting.

Usage:
    tracker = AITracking()
    
    # Log a request
    await tracker.log_request(
        provider="openai",
        model="gpt-4o",
        input_tokens=1000,
        output_tokens=500,
        cost=0.05,
        user_id=user_id,
        project_id=project_id,
        task_type="code_review"
    )
    
    # Get daily summary
    daily_cost = await tracker.get_daily_cost(user_id)
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from uuid import UUID
import logging

from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.sqlalchemy_models import (
    AIRequest,
    AICostSummary,
    AICostBudget,
)
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


class AICostTracker:
    """
    Comprehensive AI cost tracking and monitoring system.
    
    Features:
    - Log individual AI requests
    - Aggregate costs by period, provider, task type
    - Track budgets and alert on overspending
    - Provide cost analytics and insights
    """
    
    def __init__(self):
        """Initialize the cost tracker."""
        self.db = SessionLocal()
    
    # ========================================================================
    # REQUEST LOGGING
    # ========================================================================
    
    async def log_request(
        self,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        actual_cost: float,
        estimated_cost: float = 0.0,
        user_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
        task_type: Optional[str] = None,
        status: str = "completed",
        latency_ms: Optional[int] = None,
        prompt_text: Optional[str] = None,
        response_length: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> UUID:
        """
        Log an AI request with all relevant details.
        
        Args:
            provider: AI provider (openai, anthropic, gemini, etc)
            model: Model used (gpt-4o, claude-3-5-sonnet, etc)
            input_tokens: Number of input tokens used
            output_tokens: Number of output tokens generated
            actual_cost: Actual cost in USD
            estimated_cost: Estimated cost (for comparison)
            user_id: User who made the request
            project_id: Project this request belongs to
            task_type: Type of task (code_review, code_generation, etc)
            status: Request status (completed, failed, etc)
            latency_ms: Response time in milliseconds
            prompt_text: The prompt sent (optional, for deduplication)
            response_length: Length of response in characters
            metadata: Custom metadata
            error_message: Error message if failed
        
        Returns:
            UUID of the logged request
        """
        
        try:
            # Calculate prompt hash for deduplication
            prompt_hash = None
            if prompt_text:
                prompt_hash = hashlib.sha256(prompt_text.encode()).hexdigest()
            
            # Create request record
            request_record = AIRequest(
                provider=provider,
                model=model,
                task_type=task_type,
                user_id=user_id,
                project_id=project_id,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
                estimated_cost=estimated_cost,
                actual_cost=actual_cost,
                status=status,
                latency_ms=latency_ms,
                prompt_hash=prompt_hash,
                response_length=response_length,
                request_metadata=metadata or {},
                error_message=error_message,
                created_at=datetime.utcnow(),
                completed_at=datetime.utcnow() if status == "completed" else None,
            )
            
            self.db.add(request_record)
            self.db.commit()
            self.db.refresh(request_record)
            
            logger.info(
                f"Logged AI request: {provider} {model}, "
                f"tokens: {input_tokens}+{output_tokens}, cost: ${actual_cost:.6f}"
            )
            
            # Update daily summary async
            await self._update_daily_summary(user_id, project_id)
            
            # Check budget alert
            await self._check_budget_alert(user_id)
            
            return request_record.id
            
        except Exception as e:
            logger.error(f"Error logging AI request: {e}")
            raise
    
    # ========================================================================
    # COST AGGREGATION
    # ========================================================================
    
    async def get_daily_cost(
        self,
        user_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
        organization_id: Optional[UUID] = None,
        date: Optional[datetime] = None
    ) -> float:
        """
        Get total cost for a specific day.
        
        Args:
            user_id: Filter by user
            project_id: Filter by project
            organization_id: Filter by organization
            date: Specific date (default: today)
        
        Returns:
            Total cost in USD
        """
        
        if date is None:
            date = datetime.utcnow().date()
        
        query = self.db.query(func.sum(AIRequest.actual_cost)).filter(
            func.date(AIRequest.created_at) == date,
            AIRequest.status == "completed"
        )
        
        if user_id:
            query = query.filter(AIRequest.user_id == user_id)
        if project_id:
            query = query.filter(AIRequest.project_id == project_id)
        
        total = query.scalar() or 0.0
        return float(total)
    
    async def get_monthly_cost(
        self,
        user_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
    ) -> float:
        """Get total cost for current month."""
        
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        
        query = self.db.query(func.sum(AIRequest.actual_cost)).filter(
            AIRequest.created_at >= month_start,
            AIRequest.status == "completed"
        )
        
        if user_id:
            query = query.filter(AIRequest.user_id == user_id)
        if project_id:
            query = query.filter(AIRequest.project_id == project_id)
        
        total = query.scalar() or 0.0
        return float(total)
    
    async def get_cost_by_provider(
        self,
        user_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, float]:
        """
        Get cost breakdown by provider.
        
        Returns:
            {provider: cost, ...}
        """
        
        if start_date is None:
            start_date = datetime.utcnow().date() - timedelta(days=30)
        if end_date is None:
            end_date = datetime.utcnow().date()
        
        query = self.db.query(
            AIRequest.provider,
            func.sum(AIRequest.actual_cost).label('total_cost')
        ).filter(
            AIRequest.created_at >= start_date,
            AIRequest.created_at <= end_date,
            AIRequest.status == "completed"
        )
        
        if user_id:
            query = query.filter(AIRequest.user_id == user_id)
        
        query = query.group_by(AIRequest.provider)
        
        result = {}
        for provider, cost in query.all():
            result[provider] = float(cost or 0.0)
        
        return result
    
    async def get_cost_by_model(
        self,
        user_id: Optional[UUID] = None,
        limit: int = 10
    ) -> Dict[str, float]:
        """
        Get top models by cost.
        
        Returns:
            {model: cost, ...}
        """
        
        query = self.db.query(
            AIRequest.model,
            func.sum(AIRequest.actual_cost).label('total_cost')
        ).filter(
            AIRequest.status == "completed"
        )
        
        if user_id:
            query = query.filter(AIRequest.user_id == user_id)
        
        query = query.group_by(AIRequest.model).order_by(
            func.sum(AIRequest.actual_cost).desc()
        ).limit(limit)
        
        result = {}
        for model, cost in query.all():
            result[model] = float(cost or 0.0)
        
        return result
    
    async def get_cost_by_task(
        self,
        user_id: Optional[UUID] = None
    ) -> Dict[str, float]:
        """Get cost breakdown by task type."""
        
        query = self.db.query(
            AIRequest.task_type,
            func.sum(AIRequest.actual_cost).label('total_cost')
        ).filter(
            AIRequest.status == "completed",
            AIRequest.task_type.isnot(None)
        )
        
        if user_id:
            query = query.filter(AIRequest.user_id == user_id)
        
        query = query.group_by(AIRequest.task_type)
        
        result = {}
        for task, cost in query.all():
            result[task] = float(cost or 0.0)
        
        return result
    
    # ========================================================================
    # STATISTICS & ANALYTICS
    # ========================================================================
    
    async def get_request_stats(
        self,
        user_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get comprehensive request statistics.
        
        Returns:
            {
                'total_requests': int,
                'total_tokens': int,
                'total_cost': float,
                'avg_cost_per_request': float,
                'avg_latency_ms': float,
                'success_rate': float,
                'most_used_model': str,
                'most_used_provider': str
            }
        """
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = self.db.query(AIRequest).filter(
            AIRequest.created_at >= start_date
        )
        
        if user_id:
            query = query.filter(AIRequest.user_id == user_id)
        if project_id:
            query = query.filter(AIRequest.project_id == project_id)
        
        requests = query.all()
        
        if not requests:
            return {
                'total_requests': 0,
                'total_tokens': 0,
                'total_cost': 0.0,
                'avg_cost_per_request': 0.0,
                'avg_latency_ms': 0,
                'success_rate': 0.0,
                'most_used_model': None,
                'most_used_provider': None
            }
        
        total_cost = sum(r.actual_cost for r in requests)
        total_tokens = sum(r.total_tokens for r in requests)
        successful = len([r for r in requests if r.status == "completed"])
        latencies = [r.latency_ms for r in requests if r.latency_ms]
        
        # Find most used
        providers = {}
        models = {}
        for r in requests:
            providers[r.provider] = providers.get(r.provider, 0) + 1
            models[r.model] = models.get(r.model, 0) + 1
        
        most_used_provider = max(providers, key=providers.get) if providers else None
        most_used_model = max(models, key=models.get) if models else None
        
        return {
            'total_requests': len(requests),
            'total_tokens': total_tokens,
            'total_cost': float(total_cost),
            'avg_cost_per_request': float(total_cost / len(requests)) if len(requests) > 0 else 0.0,
            'avg_latency_ms': float(sum(latencies) / len(latencies)) if latencies else 0.0,
            'success_rate': float(successful / len(requests)) if requests else 0.0,
            'most_used_model': most_used_model,
            'most_used_provider': most_used_provider
        }
    
    # ========================================================================
    # BUDGET MANAGEMENT
    # ========================================================================
    
    async def set_budget(
        self,
        user_id: Optional[UUID] = None,
        organization_id: Optional[UUID] = None,
        amount: float = 100.0,
        period: str = "monthly",
        warning_threshold: float = 0.8,
        enforce_limit: bool = False
    ) -> UUID:
        """
        Set a cost budget.
        
        Args:
            user_id: Budget for specific user
            organization_id: Budget for organization
            amount: Budget amount in USD
            period: Budget period (monthly, weekly, daily)
            warning_threshold: Alert when this % is reached
            enforce_limit: Block requests if budget exceeded
        
        Returns:
            Budget ID
        """
        
        now = datetime.utcnow()
        
        if period == "monthly":
            period_end = datetime(now.year, now.month + 1, 1) - timedelta(days=1)
        elif period == "weekly":
            period_end = now + timedelta(days=7)
        else:  # daily
            period_end = now + timedelta(days=1)
        
        budget = AICostBudget(
            user_id=user_id,
            organization_id=organization_id,
            budget_amount=amount,
            budget_period=period,
            warning_threshold=warning_threshold,
            enforce_limit=enforce_limit,
            remaining_amount=amount,
            period_start=now,
            period_end=period_end,
        )
        
        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)
        
        logger.info(f"Set AI budget: ${amount} for user_id={user_id}")
        
        return budget.id
    
    async def check_budget(self, user_id: UUID) -> Dict[str, Any]:
        """
        Check if user is within budget.
        
        Returns:
            {
                'within_budget': bool,
                'spent': float,
                'budget': float,
                'remaining': float,
                'percentage_used': float,
                'alert_level': 'ok' | 'warning' | 'over_limit'
            }
        """
        
        budget = self.db.query(AICostBudget).filter(
            AICostBudget.user_id == user_id,
            AICostBudget.is_active == True
        ).first()
        
        if not budget:
            return {
                'within_budget': True,
                'spent': 0.0,
                'budget': None,
                'remaining': None,
                'percentage_used': None,
                'alert_level': 'ok'
            }
        
        spent = await self.get_daily_cost(user_id=user_id)
        percentage = spent / budget.budget_amount if budget.budget_amount > 0 else 0.0
        
        alert_level = 'ok'
        if percentage >= 1.0:
            alert_level = 'over_limit'
        elif percentage >= budget.warning_threshold:
            alert_level = 'warning'
        
        return {
            'within_budget': percentage < 1.0,
            'spent': float(spent),
            'budget': float(budget.budget_amount),
            'remaining': float(budget.budget_amount - spent),
            'percentage_used': float(percentage * 100),
            'alert_level': alert_level
        }
    
    # ========================================================================
    # PRIVATE HELPERS
    # ========================================================================
    
    async def _update_daily_summary(
        self,
        user_id: Optional[UUID],
        project_id: Optional[UUID]
    ):
        """Update daily cost summary."""
        
        try:
            date = datetime.utcnow().date()
            
            # Get or create summary
            summary = self.db.query(AICostSummary).filter(
                AICostSummary.user_id == user_id,
                func.date(AICostSummary.date) == date
            ).first()
            
            if not summary and (user_id or project_id):
                summary = AICostSummary(
                    user_id=user_id,
                    project_id=project_id,
                    date=datetime.utcnow()
                )
                self.db.add(summary)
            
            if summary:
                # Recalculate from requests
                query = self.db.query(AIRequest).filter(
                    func.date(AIRequest.created_at) == date,
                    AIRequest.status == "completed"
                )
                if user_id:
                    query = query.filter(AIRequest.user_id == user_id)
                
                requests = query.all()
                
                summary.total_cost = sum(r.actual_cost for r in requests)
                summary.total_requests = len(requests)
                summary.total_tokens = sum(r.total_tokens for r in requests)
                summary.total_input_tokens = sum(r.input_tokens for r in requests)
                summary.total_output_tokens = sum(r.output_tokens for r in requests)
                
                # Cost by provider
                provider_costs = {}
                provider_counts = {}
                for r in requests:
                    provider_costs[r.provider] = provider_costs.get(r.provider, 0) + r.actual_cost
                    provider_counts[r.provider] = provider_counts.get(r.provider, 0) + 1
                
                summary.cost_by_provider = provider_costs
                summary.requests_by_provider = provider_counts
                
                self.db.commit()
        
        except Exception as e:
            logger.warning(f"Could not update daily summary: {e}")
    
    async def _check_budget_alert(self, user_id: Optional[UUID]):
        """Check if budget alert should be sent."""
        
        if not user_id:
            return
        
        budget_status = await self.check_budget(user_id)
        
        if budget_status['alert_level'] == 'warning':
            logger.warning(
                f"User {user_id} at {budget_status['percentage_used']:.0f}% of budget"
            )
        elif budget_status['alert_level'] == 'over_limit':
            logger.error(
                f"User {user_id} EXCEEDED BUDGET: ${budget_status['spent']:.2f} / "
                f"${budget_status['budget']:.2f}"
            )


# Global singleton
_tracker_instance: Optional[AICostTracker] = None


def get_cost_tracker() -> AICostTracker:
    """Get the global cost tracker instance."""
    global _tracker_instance
    if _tracker_instance is None:
        _tracker_instance = AICostTracker()
    return _tracker_instance
