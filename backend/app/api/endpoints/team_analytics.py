"""
Team Analytics API - Enterprise-grade onboarding analytics
===========================================================
This module provides team-level analytics that MCP+Cursor cannot offer:
- Average onboarding time tracking
- Skill gap heatmaps
- ROI calculations
- Team-wide progress visibility
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random  # For demo data generation

router = APIRouter()

# ============================================================================
# Request/Response Models
# ============================================================================

class TeamMember(BaseModel):
    id: str
    name: str
    email: str
    role: str
    start_date: str
    current_phase: int
    total_phases: int
    tasks_completed: int
    total_tasks: int
    time_spent_hours: float
    skill_scores: Dict[str, int]  # Skill name -> score (0-100)
    last_active: str
    repositories_analyzed: List[str]

class TeamAnalyticsRequest(BaseModel):
    team_id: str
    members: List[TeamMember]
    date_range_days: int = 30

class OnboardingMetrics(BaseModel):
    avg_onboarding_days: float
    median_onboarding_days: float
    fastest_onboarding_days: float
    slowest_onboarding_days: float
    avg_tasks_per_day: float
    completion_rate: float
    active_members: int
    total_members: int

class SkillGapHeatmap(BaseModel):
    skill_name: str
    avg_score: float
    members_below_threshold: int
    recommended_resources: List[str]
    priority: str  # critical, high, medium, low

class ROIMetrics(BaseModel):
    estimated_hours_saved: float
    traditional_onboarding_cost: float
    codeflow_onboarding_cost: float
    roi_percentage: float
    time_to_first_pr_days: float
    productivity_improvement: float

class TeamAnalyticsResponse(BaseModel):
    team_id: str
    generated_at: str
    onboarding_metrics: OnboardingMetrics
    skill_gaps: List[SkillGapHeatmap]
    roi_metrics: ROIMetrics
    member_rankings: List[Dict[str, Any]]
    friction_points: List[Dict[str, Any]]
    recommendations: List[str]

# ============================================================================
# Analytics Endpoints
# ============================================================================

@router.post("/team-overview", response_model=TeamAnalyticsResponse)
async def get_team_analytics(request: TeamAnalyticsRequest):
    """
    Generate comprehensive team analytics for onboarding.
    This is a HACKATHON KILLER FEATURE - shows enterprise value.
    """
    try:
        members = request.members
        
        if not members:
            # Return demo data for empty teams
            return generate_demo_analytics(request.team_id)
        
        # Calculate onboarding metrics
        onboarding_metrics = calculate_onboarding_metrics(members)
        
        # Analyze skill gaps
        skill_gaps = analyze_skill_gaps(members)
        
        # Calculate ROI
        roi_metrics = calculate_roi(members, onboarding_metrics)
        
        # Rank members by progress
        member_rankings = rank_members(members)
        
        # Identify friction points
        friction_points = identify_friction_points(members, skill_gaps)
        
        # Generate recommendations
        recommendations = generate_recommendations(onboarding_metrics, skill_gaps, friction_points)
        
        return TeamAnalyticsResponse(
            team_id=request.team_id,
            generated_at=datetime.now().isoformat(),
            onboarding_metrics=onboarding_metrics,
            skill_gaps=skill_gaps,
            roi_metrics=roi_metrics,
            member_rankings=member_rankings,
            friction_points=friction_points,
            recommendations=recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/demo-data")
async def get_demo_analytics_data():
    """Get demo analytics data for hackathon demonstration."""
    return generate_demo_analytics("demo-team")

# ============================================================================
# Analytics Calculation Functions
# ============================================================================

def calculate_onboarding_metrics(members: List[TeamMember]) -> OnboardingMetrics:
    """Calculate team-wide onboarding metrics."""
    if not members:
        return OnboardingMetrics(
            avg_onboarding_days=0, median_onboarding_days=0,
            fastest_onboarding_days=0, slowest_onboarding_days=0,
            avg_tasks_per_day=0, completion_rate=0,
            active_members=0, total_members=0
        )
    
    # Calculate days since start for each member
    now = datetime.now()
    onboarding_days = []
    for m in members:
        try:
            start = datetime.fromisoformat(m.start_date.replace('Z', '+00:00'))
            days = (now - start.replace(tzinfo=None)).days
            onboarding_days.append(max(1, days))
        except:
            onboarding_days.append(7)  # Default to 7 days
    
    # Calculate completion rates
    completion_rates = [m.tasks_completed / max(1, m.total_tasks) for m in members]
    
    # Calculate tasks per day
    tasks_per_day = [m.tasks_completed / max(1, days) 
                     for m, days in zip(members, onboarding_days)]
    
    sorted_days = sorted(onboarding_days)
    median_idx = len(sorted_days) // 2
    
    # Count active members (active in last 3 days)
    active_count = 0
    for m in members:
        try:
            last_active = datetime.fromisoformat(m.last_active.replace('Z', '+00:00'))
            if (now - last_active.replace(tzinfo=None)).days <= 3:
                active_count += 1
        except:
            pass
    
    return OnboardingMetrics(
        avg_onboarding_days=round(sum(onboarding_days) / len(onboarding_days), 1),
        median_onboarding_days=sorted_days[median_idx],
        fastest_onboarding_days=min(onboarding_days),
        slowest_onboarding_days=max(onboarding_days),
        avg_tasks_per_day=round(sum(tasks_per_day) / len(tasks_per_day), 2),
        completion_rate=round(sum(completion_rates) / len(completion_rates) * 100, 1),
        active_members=active_count,
        total_members=len(members)
    )

def analyze_skill_gaps(members: List[TeamMember]) -> List[SkillGapHeatmap]:
    """Identify team-wide skill gaps."""
    if not members:
        return []
    
    # Aggregate all skill scores
    skill_aggregates: Dict[str, List[int]] = {}
    for m in members:
        for skill, score in m.skill_scores.items():
            if skill not in skill_aggregates:
                skill_aggregates[skill] = []
            skill_aggregates[skill].append(score)
    
    gaps = []
    threshold = 70  # Below this is considered a gap
    
    for skill, scores in skill_aggregates.items():
        avg_score = sum(scores) / len(scores)
        below_threshold = len([s for s in scores if s < threshold])
        
        # Determine priority
        if avg_score < 40:
            priority = "critical"
        elif avg_score < 60:
            priority = "high"
        elif avg_score < 75:
            priority = "medium"
        else:
            priority = "low"
        
        # Generate resource recommendations
        resources = generate_learning_resources(skill, priority)
        
        gaps.append(SkillGapHeatmap(
            skill_name=skill,
            avg_score=round(avg_score, 1),
            members_below_threshold=below_threshold,
            recommended_resources=resources,
            priority=priority
        ))
    
    # Sort by priority
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    gaps.sort(key=lambda x: priority_order[x.priority])
    
    return gaps

def generate_learning_resources(skill: str, priority: str) -> List[str]:
    """Generate learning resource recommendations for a skill."""
    base_resources = {
        "React": ["Complete React Tutorial", "React Hooks Deep Dive", "React Patterns Guide"],
        "TypeScript": ["TypeScript Handbook", "Advanced TypeScript Patterns", "TS with React Guide"],
        "Python": ["Python Best Practices", "Advanced Python Patterns", "Python Testing Guide"],
        "FastAPI": ["FastAPI Official Tutorial", "Building APIs with FastAPI", "FastAPI + SQLAlchemy"],
        "Git": ["Git Branching Strategies", "Git Rebase vs Merge", "Advanced Git Workflows"],
        "Testing": ["Testing Best Practices", "Unit vs Integration Tests", "TDD Guide"],
        "Architecture": ["Clean Architecture", "SOLID Principles", "Design Patterns"],
    }
    
    return base_resources.get(skill, [f"Learn {skill} fundamentals", f"Advanced {skill} patterns"])

def calculate_roi(members: List[TeamMember], metrics: OnboardingMetrics) -> ROIMetrics:
    """Calculate ROI of using CodeFlow vs traditional onboarding."""
    if not members:
        return ROIMetrics(
            estimated_hours_saved=0, traditional_onboarding_cost=0,
            codeflow_onboarding_cost=0, roi_percentage=0,
            time_to_first_pr_days=0, productivity_improvement=0
        )
    
    # Industry averages (source: various tech onboarding studies)
    TRADITIONAL_ONBOARDING_WEEKS = 12  # 3 months average
    TRADITIONAL_PRODUCTIVITY_LOSS = 0.75  # 75% less productive
    SENIOR_DEV_HOURLY_COST = 100  # USD
    JUNIOR_DEV_HOURLY_COST = 50  # USD
    HOURS_PER_WEEK = 40
    
    num_members = len(members)
    
    # Traditional cost calculation
    # Senior dev time for mentoring (20 hours/week for 3 months)
    senior_mentoring_hours = TRADITIONAL_ONBOARDING_WEEKS * 20 * num_members
    senior_mentoring_cost = senior_mentoring_hours * SENIOR_DEV_HOURLY_COST
    
    # Junior productivity loss
    junior_productivity_loss = (TRADITIONAL_ONBOARDING_WEEKS * HOURS_PER_WEEK * 
                                TRADITIONAL_PRODUCTIVITY_LOSS * JUNIOR_DEV_HOURLY_COST * num_members)
    
    traditional_cost = senior_mentoring_cost + junior_productivity_loss
    
    # CodeFlow cost calculation (estimated 4 weeks to productivity)
    codeflow_weeks = max(1, metrics.avg_onboarding_days / 7)
    codeflow_mentoring_hours = codeflow_weeks * 5 * num_members  # Only 5 hours/week needed
    codeflow_mentoring_cost = codeflow_mentoring_hours * SENIOR_DEV_HOURLY_COST
    
    codeflow_productivity_loss = (codeflow_weeks * HOURS_PER_WEEK * 
                                   0.4 * JUNIOR_DEV_HOURLY_COST * num_members)  # Only 40% loss
    
    codeflow_cost = codeflow_mentoring_cost + codeflow_productivity_loss
    
    # Calculate savings
    hours_saved = senior_mentoring_hours - codeflow_mentoring_hours
    savings = traditional_cost - codeflow_cost
    roi_percentage = (savings / max(1, traditional_cost)) * 100
    
    # Productivity improvement
    productivity_improvement = ((1 - 0.4) / (1 - TRADITIONAL_PRODUCTIVITY_LOSS) - 1) * 100
    
    return ROIMetrics(
        estimated_hours_saved=round(hours_saved, 0),
        traditional_onboarding_cost=round(traditional_cost, 2),
        codeflow_onboarding_cost=round(codeflow_cost, 2),
        roi_percentage=round(roi_percentage, 1),
        time_to_first_pr_days=round(metrics.avg_onboarding_days * 0.3, 1),  # First PR at 30% of onboarding
        productivity_improvement=round(productivity_improvement, 1)
    )

def rank_members(members: List[TeamMember]) -> List[Dict[str, Any]]:
    """Rank team members by onboarding progress."""
    rankings = []
    
    for m in members:
        completion_rate = m.tasks_completed / max(1, m.total_tasks)
        phase_progress = m.current_phase / max(1, m.total_phases)
        avg_skill = sum(m.skill_scores.values()) / max(1, len(m.skill_scores))
        
        # Composite score
        score = (completion_rate * 0.4 + phase_progress * 0.3 + (avg_skill / 100) * 0.3) * 100
        
        rankings.append({
            "id": m.id,
            "name": m.name,
            "role": m.role,
            "score": round(score, 1),
            "completion_rate": round(completion_rate * 100, 1),
            "phase": f"{m.current_phase}/{m.total_phases}",
            "status": "on_track" if score >= 60 else "needs_attention" if score >= 40 else "at_risk"
        })
    
    rankings.sort(key=lambda x: x["score"], reverse=True)
    
    for i, r in enumerate(rankings):
        r["rank"] = i + 1
    
    return rankings

def identify_friction_points(members: List[TeamMember], skill_gaps: List[SkillGapHeatmap]) -> List[Dict[str, Any]]:
    """Identify common friction points in onboarding."""
    friction_points = []
    
    # Check for critical skill gaps
    critical_gaps = [g for g in skill_gaps if g.priority == "critical"]
    if critical_gaps:
        friction_points.append({
            "type": "skill_gap",
            "severity": "high",
            "description": f"Critical skill gaps in: {', '.join(g.skill_name for g in critical_gaps)}",
            "affected_members": sum(g.members_below_threshold for g in critical_gaps),
            "recommendation": "Add focused training modules for these skills"
        })
    
    # Check for stuck members (low task completion)
    stuck_members = [m for m in members if m.tasks_completed / max(1, m.total_tasks) < 0.3]
    if stuck_members:
        friction_points.append({
            "type": "progress_stall",
            "severity": "medium",
            "description": f"{len(stuck_members)} members have completed less than 30% of tasks",
            "affected_members": len(stuck_members),
            "recommendation": "Schedule 1:1 check-ins to identify blockers"
        })
    
    # Check for inactive members
    now = datetime.now()
    inactive_members = []
    for m in members:
        try:
            last_active = datetime.fromisoformat(m.last_active.replace('Z', '+00:00'))
            if (now - last_active.replace(tzinfo=None)).days > 3:
                inactive_members.append(m)
        except:
            pass
    
    if inactive_members:
        friction_points.append({
            "type": "engagement",
            "severity": "medium",
            "description": f"{len(inactive_members)} members haven't been active in 3+ days",
            "affected_members": len(inactive_members),
            "recommendation": "Send re-engagement prompts and check for blockers"
        })
    
    return friction_points

def generate_recommendations(
    metrics: OnboardingMetrics, 
    skill_gaps: List[SkillGapHeatmap],
    friction_points: List[Dict[str, Any]]
) -> List[str]:
    """Generate actionable recommendations for the team."""
    recommendations = []
    
    # Based on completion rate
    if metrics.completion_rate < 50:
        recommendations.append("🎯 Task completion is low. Consider simplifying initial tasks or extending deadlines.")
    elif metrics.completion_rate > 80:
        recommendations.append("⭐ Excellent task completion! Consider adding advanced challenges.")
    
    # Based on skill gaps
    critical_gaps = [g for g in skill_gaps if g.priority == "critical"]
    if critical_gaps:
        skills = ", ".join(g.skill_name for g in critical_gaps[:3])
        recommendations.append(f"📚 Schedule team learning sessions for: {skills}")
    
    # Based on onboarding time
    if metrics.avg_onboarding_days > 14:
        recommendations.append("⏰ Onboarding is taking longer than expected. Review roadmap complexity.")
    elif metrics.avg_onboarding_days < 5:
        recommendations.append("🚀 Fast onboarding! Ensure quality isn't being sacrificed for speed.")
    
    # Based on active members
    if metrics.active_members < metrics.total_members * 0.8:
        recommendations.append("👥 Member engagement is declining. Consider gamification or team challenges.")
    
    # Based on friction points
    if any(fp["severity"] == "high" for fp in friction_points):
        recommendations.append("⚠️ High-severity friction detected. Prioritize addressing blockers.")
    
    # Default positive recommendation
    if not recommendations:
        recommendations.append("✅ Team is on track! Keep up the great work.")
    
    return recommendations

def generate_demo_analytics(team_id: str) -> TeamAnalyticsResponse:
    """Generate impressive demo data for hackathons."""
    demo_members = [
        TeamMember(
            id="1", name="Alex Chen", email="alex@example.com", role="Frontend Developer",
            start_date=(datetime.now() - timedelta(days=12)).isoformat(),
            current_phase=3, total_phases=5, tasks_completed=18, total_tasks=25,
            time_spent_hours=32.5, last_active=datetime.now().isoformat(),
            skill_scores={"React": 85, "TypeScript": 78, "Git": 90, "Testing": 65},
            repositories_analyzed=["frontend-app", "shared-components"]
        ),
        TeamMember(
            id="2", name="Jordan Smith", email="jordan@example.com", role="Backend Developer",
            start_date=(datetime.now() - timedelta(days=8)).isoformat(),
            current_phase=2, total_phases=5, tasks_completed=12, total_tasks=25,
            time_spent_hours=24.0, last_active=(datetime.now() - timedelta(hours=2)).isoformat(),
            skill_scores={"Python": 72, "FastAPI": 55, "Git": 85, "Architecture": 60},
            repositories_analyzed=["api-service"]
        ),
        TeamMember(
            id="3", name="Sam Wilson", email="sam@example.com", role="Full Stack Developer",
            start_date=(datetime.now() - timedelta(days=15)).isoformat(),
            current_phase=4, total_phases=5, tasks_completed=22, total_tasks=25,
            time_spent_hours=45.0, last_active=datetime.now().isoformat(),
            skill_scores={"React": 80, "Python": 75, "TypeScript": 82, "Git": 88, "Testing": 70},
            repositories_analyzed=["frontend-app", "api-service", "shared-components"]
        ),
        TeamMember(
            id="4", name="Taylor Lee", email="taylor@example.com", role="DevOps Engineer",
            start_date=(datetime.now() - timedelta(days=5)).isoformat(),
            current_phase=1, total_phases=4, tasks_completed=5, total_tasks=20,
            time_spent_hours=12.0, last_active=(datetime.now() - timedelta(days=2)).isoformat(),
            skill_scores={"Git": 92, "Architecture": 78, "Python": 60},
            repositories_analyzed=["infrastructure"]
        )
    ]
    
    metrics = calculate_onboarding_metrics(demo_members)
    skill_gaps = analyze_skill_gaps(demo_members)
    roi_metrics = calculate_roi(demo_members, metrics)
    member_rankings = rank_members(demo_members)
    friction_points = identify_friction_points(demo_members, skill_gaps)
    recommendations = generate_recommendations(metrics, skill_gaps, friction_points)
    
    return TeamAnalyticsResponse(
        team_id=team_id,
        generated_at=datetime.now().isoformat(),
        onboarding_metrics=metrics,
        skill_gaps=skill_gaps,
        roi_metrics=roi_metrics,
        member_rankings=member_rankings,
        friction_points=friction_points,
        recommendations=recommendations
    )
