"""
CodeFlow - Agent Orchestrator
==============================
The central coordinator that orchestrates all agents to deliver
a seamless onboarding experience.

This is the HACKATHON DEMO entry point - shows all agents working together.
"""

import os
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime
import logging
import json
import asyncio

from app.agents.codebase_architect import CodebaseArchitectAgent
from app.agents.learning_path_architect import LearningPathArchitectAgent, DeveloperLevel
from app.agents.task_generation import TaskGeneratorAgent
from app.agents.interactive_tutor import InteractiveTutorAgent
from app.agents.progress import ProgressCoachAgent

logger = logging.getLogger(__name__)


@dataclass
class OnboardingSession:
    """Complete onboarding session for a developer."""
    session_id: str
    user_id: str
    repository_url: str
    started_at: datetime
    architecture_analysis: Optional[Dict[str, Any]] = None
    learning_path: Optional[Dict[str, Any]] = None
    current_phase: int = 1
    status: str = "initializing"


class AgentOrchestrator:
    """
    The Master Orchestrator
    
    Coordinates all CodeFlow agents to deliver:
    1. Initial repository analysis
    2. Personalized learning path generation
    3. Task assignment and tracking
    4. Interactive tutoring
    5. Progress coaching
    
    This is the DEMO MAGIC - shows the complete flow in action.
    """
    
    def __init__(self):
        # Initialize all agents
        self.architect = CodebaseArchitectAgent()
        self.learning_path = LearningPathArchitectAgent()
        self.task_generator = TaskGeneratorAgent()
        self.tutor = InteractiveTutorAgent()
        self.progress_coach = ProgressCoachAgent()
        
        # Session management
        self.sessions: Dict[str, OnboardingSession] = {}
        
        logger.info("AgentOrchestrator initialized with all agents")
    
    async def start_onboarding(
        self,
        user_id: str,
        repository_path: str,
        file_tree: List[Dict],
        developer_level: str = "junior",
        time_available: str = "2 weeks"
    ) -> Dict[str, Any]:
        """
        Start the complete onboarding process.
        
        This is the MAIN DEMO FUNCTION - shows everything working together.
        
        Args:
            user_id: Unique user identifier
            repository_path: Path to cloned repository
            file_tree: Pre-parsed file tree
            developer_level: Experience level
            time_available: Available onboarding time
        
        Returns:
            Complete onboarding setup with roadmap and first tasks
        """
        session_id = f"session_{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        logger.info(f"Starting onboarding session: {session_id}")
        
        # Create session
        session = OnboardingSession(
            session_id=session_id,
            user_id=user_id,
            repository_url=repository_path,
            started_at=datetime.now(),
            status="analyzing"
        )
        self.sessions[session_id] = session
        
        try:
            # Step 1: Architecture Analysis
            logger.info("Step 1: Analyzing repository architecture...")
            architecture = await self.architect.analyze_repository(
                root_path=repository_path,
                file_tree=file_tree,
                max_modules_to_analyze=10
            )
            session.architecture_analysis = self.architect.to_dict(architecture)
            
            # Step 2: Generate Learning Path
            logger.info("Step 2: Generating personalized learning path...")
            level = DeveloperLevel(developer_level.lower()) if developer_level.lower() in [e.value for e in DeveloperLevel] else DeveloperLevel.JUNIOR
            
            learning_path = await self.learning_path.generate_learning_path(
                architecture_analysis=session.architecture_analysis,
                developer_level=level,
                time_available=time_available
            )
            session.learning_path = self.learning_path.to_dict(learning_path)
            
            # Step 3: Generate First Tasks
            logger.info("Step 3: Generating initial tasks...")
            quick_win = self.task_generator.generate_quick_win_task(session.architecture_analysis)
            
            initial_tasks = [self.task_generator.to_dict(quick_win)]
            
            # Add 2 more tasks for variety
            if session.architecture_analysis.get("modules"):
                for module in session.architecture_analysis["modules"][:2]:
                    task = await self.task_generator.generate_task(
                        module_info=module,
                        developer_progress={"completed_tasks": 0}
                    )
                    initial_tasks.append(self.task_generator.to_dict(task))
            
            # Step 4: Initialize Progress Tracking
            logger.info("Step 4: Initializing progress tracking...")
            progress = self.progress_coach.initialize_progress(
                user_id=user_id,
                total_phases=learning_path.total_phases
            )
            
            session.status = "ready"
            
            # Return complete onboarding setup
            return {
                "success": True,
                "session_id": session_id,
                "message": f"Welcome to your onboarding journey! 🚀",
                "architecture_summary": {
                    "type": session.architecture_analysis.get("architecture_type", "Unknown"),
                    "confidence": session.architecture_analysis.get("confidence", 0),
                    "entry_points": session.architecture_analysis.get("entry_points", [])[:5],
                    "module_count": session.architecture_analysis.get("module_count", 0),
                    "risk_zones_count": len(session.architecture_analysis.get("risk_zones", []))
                },
                "learning_path_summary": {
                    "total_phases": session.learning_path.get("total_phases", 0),
                    "estimated_hours": session.learning_path.get("estimated_total_hours", 0),
                    "milestones": session.learning_path.get("milestones", [])[:3],
                    "quick_wins": session.learning_path.get("quick_wins", [])
                },
                "initial_tasks": initial_tasks,
                "progress": self.progress_coach.to_dict(progress),
                "next_steps": [
                    "Start with your Quick Win task to get familiar",
                    "Explore the entry points of the codebase",
                    "Ask the AI Tutor if you have any questions",
                    "Complete tasks to earn XP and badges!"
                ]
            }
            
        except Exception as e:
            logger.error(f"Error in onboarding: {e}")
            session.status = "error"
            return {
                "success": False,
                "session_id": session_id,
                "error": str(e),
                "message": "There was an error analyzing the repository. Please try again."
            }
    
    async def ask_tutor(
        self,
        session_id: str,
        user_id: str,
        question: str
    ) -> Dict[str, Any]:
        """
        Ask the AI tutor a question about the codebase.
        
        Uses the session's architecture analysis as context.
        """
        if session_id not in self.sessions:
            return {
                "success": False,
                "error": "Session not found. Please start onboarding first."
            }
        
        session = self.sessions[session_id]
        
        if not session.architecture_analysis:
            return {
                "success": False,
                "error": "Codebase not analyzed yet. Please wait for analysis to complete."
            }
        
        # Get user progress for personalization
        progress = self.progress_coach.progress_store.get(user_id)
        progress_dict = self.progress_coach.to_dict(progress) if progress else None
        
        # Ask the tutor
        response = await self.tutor.answer_question(
            user_id=user_id,
            question=question,
            codebase_context=session.architecture_analysis,
            user_progress=progress_dict
        )
        
        return {
            "success": True,
            "answer": response.answer,
            "confidence": response.confidence,
            "references": response.references,
            "suggestions": response.follow_up_suggestions,
            "learning_tip": response.learning_tip
        }
    
    async def complete_task(
        self,
        session_id: str,
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
        Mark a task as complete and get next recommendations.
        """
        # Record completion
        result = self.progress_coach.record_task_completion(
            user_id=user_id,
            task_id=task_id,
            task_title=task_title,
            time_spent_minutes=time_spent_minutes,
            difficulty=difficulty,
            hints_used=hints_used,
            self_rating=self_rating,
            concepts_learned=concepts_learned
        )
        
        # Get personalized feedback
        feedback = await self.progress_coach.get_personalized_feedback(user_id)
        
        # Generate next task if session exists
        next_task = None
        if session_id in self.sessions:
            session = self.sessions[session_id]
            if session.architecture_analysis and session.architecture_analysis.get("modules"):
                # Get a random unvisited module
                progress = self.progress_coach.progress_store.get(user_id)
                completed_count = len(progress.completed_tasks) if progress else 0
                
                # Pick next module based on progress
                modules = session.architecture_analysis["modules"]
                if completed_count < len(modules):
                    next_module = modules[min(completed_count, len(modules) - 1)]
                    task = await self.task_generator.generate_task(
                        module_info=next_module,
                        developer_progress={"completed_tasks": completed_count}
                    )
                    next_task = self.task_generator.to_dict(task)
        
        return {
            "success": True,
            "completion_result": result,
            "feedback": {
                "greeting": feedback.greeting,
                "recent_win": feedback.recent_win,
                "encouragement": feedback.encouragement,
                "next_focus": feedback.next_focus,
                "improvement_tip": feedback.improvement_tip
            },
            "next_task": next_task
        }
    
    async def get_dashboard(self, user_id: str) -> Dict[str, Any]:
        """
        Get complete dashboard data for a user.
        
        Includes progress, current tasks, and recommendations.
        """
        progress = self.progress_coach.progress_store.get(user_id)
        
        if not progress:
            return {
                "success": False,
                "message": "No progress data found. Start onboarding first!"
            }
        
        # Find user's session
        user_session = None
        for session in self.sessions.values():
            if session.user_id == user_id:
                user_session = session
                break
        
        # Get feedback
        feedback = await self.progress_coach.get_personalized_feedback(user_id)
        
        return {
            "success": True,
            "progress": self.progress_coach.to_dict(progress),
            "session": {
                "session_id": user_session.session_id if user_session else None,
                "status": user_session.status if user_session else "no_session",
                "repository": user_session.repository_url if user_session else None
            },
            "feedback": {
                "greeting": feedback.greeting,
                "recent_win": feedback.recent_win,
                "progress_summary": feedback.progress_summary,
                "encouragement": feedback.encouragement
            },
            "leaderboard": self.progress_coach.get_leaderboard(5)
        }
    
    async def get_onboarding_roadmap(
        self,
        session_id: str,
        role: str = "Backend Developer"
    ) -> Dict[str, Any]:
        """
        Generate a complete onboarding roadmap document.
        
        Perfect for DEMO - shows the full structured output.
        """
        if session_id not in self.sessions:
            return {"success": False, "error": "Session not found"}
        
        session = self.sessions[session_id]
        
        if not session.architecture_analysis:
            return {"success": False, "error": "Analysis not complete"}
        
        # Format repository summary
        arch = session.architecture_analysis
        repo_summary = f"""
Repository Type: {arch.get('architecture_type', 'Unknown')}
Total Modules: {arch.get('module_count', 0)}
Entry Points: {', '.join(arch.get('entry_points', [])[:5])}

Key Layers:
{json.dumps(arch.get('layers', []), indent=2)}

Risk Zones: {len(arch.get('risk_zones', []))} identified
"""
        
        roadmap = await self.learning_path.generate_onboarding_roadmap(
            repository_summary=repo_summary,
            role=role
        )
        
        return {
            "success": True,
            "roadmap": roadmap,
            "note": "This roadmap is personalized based on your codebase analysis"
        }
    
    def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """Get current status of an onboarding session."""
        if session_id not in self.sessions:
            return {"found": False}
        
        session = self.sessions[session_id]
        return {
            "found": True,
            "session_id": session_id,
            "user_id": session.user_id,
            "status": session.status,
            "started_at": session.started_at.isoformat(),
            "current_phase": session.current_phase,
            "has_analysis": session.architecture_analysis is not None,
            "has_learning_path": session.learning_path is not None
        }


# Global orchestrator instance
_orchestrator: Optional[AgentOrchestrator] = None

def get_orchestrator() -> AgentOrchestrator:
    """Get the global orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
