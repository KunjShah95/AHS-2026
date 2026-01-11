"""
CodeFlow - Progress Coach Agent
================================
Tracks developer progress and provides personalized feedback.

HACKATHON DIFFERENTIATOR:
This is the ENTERPRISE value proposition!
- Analytics for managers
- Personalized coaching for developers  
- Measurable onboarding metrics
- ROI justification for the product
"""

import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import logging
import json

from app.core.gemini_client import get_gemini_client
from app.core.prompts import (
    PROGRESS_COACH_SYSTEM,
    get_progress_feedback_prompt
)

logger = logging.getLogger(__name__)


class LearningVelocity(str, Enum):
    ACCELERATING = "accelerating"
    ON_TRACK = "on_track"
    SLOWING = "slowing"
    STALLED = "stalled"


@dataclass
class TaskCompletion:
    """Record of a completed task."""
    task_id: str
    task_title: str
    completed_at: datetime
    time_spent_minutes: int
    difficulty: int
    hints_used: int
    self_rating: int  # 1-5 how comfortable they feel


@dataclass
class ConceptMastery:
    """Track mastery of a specific concept."""
    concept_name: str
    exposure_count: int  # How many times encountered
    practice_count: int  # How many tasks related to this
    quiz_score: Optional[float] = None
    confidence_rating: int = 0  # Developer's self-assessment 1-10
    last_practiced: Optional[datetime] = None


@dataclass
class DeveloperProgress:
    """Complete progress record for a developer."""
    user_id: str
    started_at: datetime
    current_phase: int
    total_phases: int
    completed_tasks: List[TaskCompletion]
    concept_mastery: Dict[str, ConceptMastery]
    total_xp: int
    badges: List[str]
    time_spent_hours: float
    velocity: LearningVelocity
    strengths: List[str]
    growth_areas: List[str]
    estimated_completion_date: Optional[datetime] = None


@dataclass
class ProgressFeedback:
    """Personalized feedback for a developer."""
    greeting: str
    recent_win: str
    progress_summary: Dict[str, Any]
    next_focus: Dict[str, Any]
    improvement_tip: str
    estimated_days_to_complete: int
    encouragement: str


class ProgressCoachAgent:
    """
    Agent 5: Progress Coach
    
    A data-driven coach that:
    1. Tracks detailed progress metrics
    2. Identifies learning patterns
    3. Provides personalized feedback
    4. Generates team-wide analytics
    5. Motivates through gamification
    
    This is the ENTERPRISE feature that justifies the product cost:
    - Managers get visibility into onboarding progress
    - Developers get personalized guidance
    - Companies can measure and improve onboarding
    """
    
    def __init__(self):
        self.gemini = get_gemini_client()
        self.progress_store: Dict[str, DeveloperProgress] = {}
    
    def initialize_progress(
        self,
        user_id: str,
        total_phases: int = 5
    ) -> DeveloperProgress:
        """Initialize progress tracking for a new developer."""
        progress = DeveloperProgress(
            user_id=user_id,
            started_at=datetime.now(),
            current_phase=1,
            total_phases=total_phases,
            completed_tasks=[],
            concept_mastery={},
            total_xp=0,
            badges=["Welcome Badge 👋"],
            time_spent_hours=0.0,
            velocity=LearningVelocity.ON_TRACK,
            strengths=[],
            growth_areas=[],
            estimated_completion_date=datetime.now() + timedelta(days=14)
        )
        
        self.progress_store[user_id] = progress
        logger.info(f"Initialized progress tracking for user: {user_id}")
        return progress
    
    def record_task_completion(
        self,
        user_id: str,
        task_id: str,
        task_title: str,
        time_spent_minutes: int,
        difficulty: int,
        hints_used: int = 0,
        self_rating: int = 3,
        concepts_learned: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Record a task completion and update progress.
        
        Returns:
            Dictionary with updated stats and any rewards earned
        """
        if user_id not in self.progress_store:
            self.initialize_progress(user_id)
        
        progress = self.progress_store[user_id]
        
        # Create completion record
        completion = TaskCompletion(
            task_id=task_id,
            task_title=task_title,
            completed_at=datetime.now(),
            time_spent_minutes=time_spent_minutes,
            difficulty=difficulty,
            hints_used=hints_used,
            self_rating=self_rating
        )
        
        progress.completed_tasks.append(completion)
        progress.time_spent_hours += time_spent_minutes / 60.0
        
        # Calculate XP earned
        base_xp = difficulty * 20
        hint_penalty = hints_used * 5
        speed_bonus = max(0, (30 - time_spent_minutes)) // 5 * 5  # Bonus for fast completion
        xp_earned = max(10, base_xp - hint_penalty + speed_bonus)
        progress.total_xp += xp_earned
        
        # Update concept mastery
        if concepts_learned:
            for concept in concepts_learned:
                if concept not in progress.concept_mastery:
                    progress.concept_mastery[concept] = ConceptMastery(
                        concept_name=concept,
                        exposure_count=0,
                        practice_count=0
                    )
                
                progress.concept_mastery[concept].practice_count += 1
                progress.concept_mastery[concept].last_practiced = datetime.now()
        
        # Check for badge rewards
        new_badges = self._check_badge_rewards(progress)
        progress.badges.extend(new_badges)
        
        # Update velocity
        progress.velocity = self._calculate_velocity(progress)
        
        # Update estimated completion
        progress.estimated_completion_date = self._estimate_completion(progress)
        
        return {
            "xp_earned": xp_earned,
            "total_xp": progress.total_xp,
            "new_badges": new_badges,
            "velocity": progress.velocity.value,
            "tasks_completed": len(progress.completed_tasks),
            "estimated_days_remaining": (progress.estimated_completion_date - datetime.now()).days if progress.estimated_completion_date else None
        }
    
    def update_phase(self, user_id: str, new_phase: int):
        """Update the developer's current phase."""
        if user_id not in self.progress_store:
            return
        
        progress = self.progress_store[user_id]
        progress.current_phase = new_phase
        
        # Add phase completion badge
        if new_phase > 1:
            badge = f"Phase {new_phase - 1} Complete 🏆"
            if badge not in progress.badges:
                progress.badges.append(badge)
    
    async def get_personalized_feedback(self, user_id: str) -> ProgressFeedback:
        """
        Generate personalized coaching feedback.
        
        This uses AI to analyze progress patterns and provide
        motivational, actionable feedback.
        """
        if user_id not in self.progress_store:
            self.initialize_progress(user_id)
        
        progress = self.progress_store[user_id]
        
        # Format data for AI
        completed_tasks_str = "\n".join([
            f"- {t.task_title} (Difficulty: {t.difficulty}, Time: {t.time_spent_minutes}min)"
            for t in progress.completed_tasks[-10:]
        ])
        
        concept_scores_str = "\n".join([
            f"- {c.concept_name}: Practiced {c.practice_count} times, Confidence: {c.confidence_rating}/10"
            for c in progress.concept_mastery.values()
        ])
        
        # Generate AI feedback
        prompt = get_progress_feedback_prompt(
            developer_name=f"Developer {user_id[:8]}",
            completed_tasks=completed_tasks_str or "No tasks completed yet",
            current_phase=progress.current_phase,
            time_spent_hours=progress.time_spent_hours,
            concept_scores=concept_scores_str or "No concepts tracked yet"
        )
        
        result = self.gemini.generate_json(prompt, PROGRESS_COACH_SYSTEM, use_flash=True)
        
        return ProgressFeedback(
            greeting=result.get("greeting", f"Hey there! 👋"),
            recent_win=result.get("recent_win", "You've started your onboarding journey!"),
            progress_summary=result.get("progress_summary", {
                "completion_percentage": self._calculate_completion_percentage(progress),
                "pace": progress.velocity.value,
                "strongest_area": progress.strengths[0] if progress.strengths else "Exploration",
                "growth_area": progress.growth_areas[0] if progress.growth_areas else "Still learning"
            }),
            next_focus=result.get("next_focus", {
                "concept": "Continue with current phase",
                "why": "Consistency is key",
                "estimated_hours": 4
            }),
            improvement_tip=result.get("improvement_tip", "Take notes as you explore - they'll be valuable later!"),
            estimated_days_to_complete=result.get("estimated_days_to_competency", 10),
            encouragement=result.get("encouragement", "You're making great progress! Keep going! 🚀")
        )
    
    def get_team_analytics(self, user_ids: List[str]) -> Dict[str, Any]:
        """
        Generate team-wide onboarding analytics.
        
        This is the MANAGER DASHBOARD feature.
        """
        team_progress = []
        
        for user_id in user_ids:
            if user_id in self.progress_store:
                progress = self.progress_store[user_id]
                team_progress.append({
                    "user_id": user_id[:8],  # Anonymized
                    "started_at": progress.started_at.isoformat(),
                    "current_phase": progress.current_phase,
                    "tasks_completed": len(progress.completed_tasks),
                    "time_spent_hours": round(progress.time_spent_hours, 1),
                    "velocity": progress.velocity.value,
                    "xp": progress.total_xp
                })
        
        if not team_progress:
            return {"message": "No team progress data available"}
        
        # Calculate team-wide metrics
        avg_tasks = sum(p["tasks_completed"] for p in team_progress) / len(team_progress)
        avg_hours = sum(p["time_spent_hours"] for p in team_progress) / len(team_progress)
        
        velocity_counts = {}
        for p in team_progress:
            v = p["velocity"]
            velocity_counts[v] = velocity_counts.get(v, 0) + 1
        
        return {
            "team_size": len(team_progress),
            "average_tasks_completed": round(avg_tasks, 1),
            "average_hours_invested": round(avg_hours, 1),
            "velocity_distribution": velocity_counts,
            "individual_progress": team_progress,
            "insights": self._generate_team_insights(team_progress)
        }
    
    def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get XP leaderboard for gamification."""
        sorted_users = sorted(
            self.progress_store.values(),
            key=lambda p: p.total_xp,
            reverse=True
        )[:limit]
        
        return [
            {
                "rank": i + 1,
                "user_id": p.user_id[:8],
                "xp": p.total_xp,
                "badges": len(p.badges),
                "tasks_completed": len(p.completed_tasks)
            }
            for i, p in enumerate(sorted_users)
        ]
    
    def _check_badge_rewards(self, progress: DeveloperProgress) -> List[str]:
        """Check if any new badges should be awarded."""
        new_badges = []
        
        # Task count badges
        task_count = len(progress.completed_tasks)
        if task_count == 1 and "First Task Complete 🎯" not in progress.badges:
            new_badges.append("First Task Complete 🎯")
        if task_count == 5 and "Getting Started 🌱" not in progress.badges:
            new_badges.append("Getting Started 🌱")
        if task_count == 10 and "On a Roll 🔥" not in progress.badges:
            new_badges.append("On a Roll 🔥")
        if task_count == 25 and "Task Master 👑" not in progress.badges:
            new_badges.append("Task Master 👑")
        
        # XP badges
        if progress.total_xp >= 100 and "Century Club 💯" not in progress.badges:
            new_badges.append("Century Club 💯")
        if progress.total_xp >= 500 and "XP Champion ⚡" not in progress.badges:
            new_badges.append("XP Champion ⚡")
        
        # Speed badges
        if progress.completed_tasks:
            last_task = progress.completed_tasks[-1]
            if last_task.time_spent_minutes < 15 and "Speed Demon 💨" not in progress.badges:
                new_badges.append("Speed Demon 💨")
            if last_task.hints_used == 0 and "No Hints Needed 🧠" not in progress.badges:
                new_badges.append("No Hints Needed 🧠")
        
        return new_badges
    
    def _calculate_velocity(self, progress: DeveloperProgress) -> LearningVelocity:
        """Calculate learning velocity based on recent activity."""
        if len(progress.completed_tasks) < 3:
            return LearningVelocity.ON_TRACK
        
        # Get last 3 tasks
        recent = progress.completed_tasks[-3:]
        
        # Check time between completions
        if len(recent) >= 2:
            gaps = []
            for i in range(1, len(recent)):
                gap = (recent[i].completed_at - recent[i-1].completed_at).total_seconds() / 3600
                gaps.append(gap)
            
            avg_gap = sum(gaps) / len(gaps)
            
            if avg_gap < 2:  # Less than 2 hours between tasks
                return LearningVelocity.ACCELERATING
            elif avg_gap > 24:  # More than a day between tasks
                return LearningVelocity.SLOWING
            elif avg_gap > 72:  # More than 3 days
                return LearningVelocity.STALLED
        
        return LearningVelocity.ON_TRACK
    
    def _estimate_completion(self, progress: DeveloperProgress) -> datetime:
        """Estimate completion date based on current velocity."""
        if not progress.completed_tasks:
            return datetime.now() + timedelta(days=14)
        
        # Calculate average tasks per day
        days_elapsed = max(1, (datetime.now() - progress.started_at).days)
        tasks_per_day = len(progress.completed_tasks) / days_elapsed
        
        if tasks_per_day == 0:
            return datetime.now() + timedelta(days=30)
        
        # Estimate remaining tasks (assume 5 tasks per phase)
        remaining_phases = progress.total_phases - progress.current_phase
        estimated_remaining_tasks = remaining_phases * 5
        
        estimated_days = estimated_remaining_tasks / max(0.1, tasks_per_day)
        
        return datetime.now() + timedelta(days=int(estimated_days))
    
    def _calculate_completion_percentage(self, progress: DeveloperProgress) -> float:
        """Calculate overall completion percentage."""
        if progress.total_phases == 0:
            return 0.0
        
        phase_progress = (progress.current_phase - 1) / progress.total_phases
        
        # Add partial progress for current phase (assume 5 tasks per phase)
        tasks_in_current_phase = min(5, len(progress.completed_tasks))
        current_phase_progress = (tasks_in_current_phase / 5) / progress.total_phases
        
        return min(100, (phase_progress + current_phase_progress) * 100)
    
    def _generate_team_insights(self, team_progress: List[Dict]) -> List[str]:
        """Generate actionable insights for managers."""
        insights = []
        
        # Check for stalled developers
        stalled = [p for p in team_progress if p["velocity"] == "stalled"]
        if stalled:
            insights.append(f"⚠️ {len(stalled)} developer(s) may need additional support")
        
        # Check for high performers
        accelerating = [p for p in team_progress if p["velocity"] == "accelerating"]
        if accelerating:
            insights.append(f"🌟 {len(accelerating)} developer(s) are ahead of schedule")
        
        # Time investment
        avg_hours = sum(p["time_spent_hours"] for p in team_progress) / len(team_progress)
        if avg_hours < 5:
            insights.append("💡 Team average onboarding time is low - consider scheduling dedicated time")
        elif avg_hours > 30:
            insights.append("✅ Team is investing significant time in onboarding")
        
        return insights
    
    def to_dict(self, progress: DeveloperProgress) -> Dict[str, Any]:
        """Convert progress to dictionary for API response."""
        return {
            "user_id": progress.user_id,
            "started_at": progress.started_at.isoformat(),
            "current_phase": progress.current_phase,
            "total_phases": progress.total_phases,
            "tasks_completed": len(progress.completed_tasks),
            "total_xp": progress.total_xp,
            "badges": progress.badges,
            "time_spent_hours": round(progress.time_spent_hours, 1),
            "velocity": progress.velocity.value,
            "strengths": progress.strengths,
            "growth_areas": progress.growth_areas,
            "estimated_completion": progress.estimated_completion_date.isoformat() if progress.estimated_completion_date else None,
            "completion_percentage": self._calculate_completion_percentage(progress)
        }
