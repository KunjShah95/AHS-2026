"""
CodeFlow - Unified Onboarding API
==================================
The main API for the hackathon demo.

This exposes all the agent functionality through clean REST endpoints.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import logging

from app.agents.orchestrator import get_orchestrator
from app.agents.repository_ingestion import RepositoryIngestionAgent

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================

class StartOnboardingRequest(BaseModel):
    """Request to start the onboarding process."""
    user_id: str = Field(..., description="Unique user identifier")
    github_url: str = Field(..., description="GitHub repository URL")
    developer_level: str = Field("junior", description="Experience level: intern, junior, mid, senior")
    time_available: str = Field("2 weeks", description="Available onboarding time")


class AskTutorRequest(BaseModel):
    """Request to ask the AI tutor a question."""
    session_id: str = Field(..., description="Active onboarding session ID")
    user_id: str = Field(..., description="User identifier")
    question: str = Field(..., description="The question to ask")


class CompleteTaskRequest(BaseModel):
    """Request to mark a task as complete."""
    session_id: str
    user_id: str
    task_id: str
    task_title: str
    time_spent_minutes: int = Field(..., ge=1, le=480)
    difficulty: int = Field(..., ge=1, le=5)
    hints_used: int = Field(0, ge=0)
    self_rating: int = Field(3, ge=1, le=5)
    concepts_learned: Optional[List[str]] = None


class GetDashboardRequest(BaseModel):
    """Request to get user dashboard."""
    user_id: str


class GenerateRoadmapRequest(BaseModel):
    """Request to generate onboarding roadmap."""
    session_id: str
    role: str = Field("Backend Developer", description="Developer role")


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/start", summary="Start Onboarding", tags=["Onboarding"])
async def start_onboarding(request: StartOnboardingRequest, background_tasks: BackgroundTasks):
    """
    Start the complete onboarding process.
    
    This is the MAIN ENTRY POINT for the hackathon demo.
    
    Steps performed:
    1. Clone the repository
    2. Analyze architecture
    3. Generate personalized learning path
    4. Create initial tasks
    5. Initialize progress tracking
    
    Returns a complete onboarding setup with roadmap and first tasks.
    """
    logger.info(f"Starting onboarding for user: {request.user_id}")
    
    try:
        # Step 1: Clone/Prepare Repository
        ingest_agent = RepositoryIngestionAgent()
        
        # Generate a unique path for this repo
        repo_name = request.github_url.split("/")[-1].replace(".git", "")
        target_path = os.path.join("repos", f"{request.user_id}_{repo_name}")
        
        # Clone repository
        try:
            target_path = ingest_agent.clone_repository(request.github_url, target_path)
        except Exception as clone_error:
            logger.error(f"Clone error: {clone_error}")
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to clone repository: {str(clone_error)}"
            )
        
        # Parse file tree
        file_tree = ingest_agent.parse_file_tree(target_path)
        
        # Step 2: Start orchestrated onboarding
        orchestrator = get_orchestrator()
        result = await orchestrator.start_onboarding(
            user_id=request.user_id,
            repository_path=target_path,
            file_tree=file_tree,
            developer_level=request.developer_level,
            time_available=request.time_available
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboarding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask", summary="Ask AI Tutor", tags=["Tutor"])
async def ask_tutor(request: AskTutorRequest):
    """
    Ask the AI tutor a question about the codebase.
    
    The tutor uses the analyzed codebase as context and personalizes
    responses based on your learning progress.
    """
    orchestrator = get_orchestrator()
    
    result = await orchestrator.ask_tutor(
        session_id=request.session_id,
        user_id=request.user_id,
        question=request.question
    )
    
    return result


@router.post("/task/complete", summary="Complete Task", tags=["Tasks"])
async def complete_task(request: CompleteTaskRequest):
    """
    Mark a task as complete and get rewards + next task.
    
    Returns:
    - XP earned
    - New badges unlocked
    - Personalized feedback
    - Next recommended task
    """
    orchestrator = get_orchestrator()
    
    result = await orchestrator.complete_task(
        session_id=request.session_id,
        user_id=request.user_id,
        task_id=request.task_id,
        task_title=request.task_title,
        time_spent_minutes=request.time_spent_minutes,
        difficulty=request.difficulty,
        hints_used=request.hints_used,
        self_rating=request.self_rating,
        concepts_learned=request.concepts_learned
    )
    
    return result


@router.get("/dashboard/{user_id}", summary="Get Dashboard", tags=["Dashboard"])
async def get_dashboard(user_id: str):
    """
    Get complete dashboard data for a user.
    
    Includes:
    - Progress overview
    - Current session status
    - Personalized feedback
    - Leaderboard
    """
    orchestrator = get_orchestrator()
    result = await orchestrator.get_dashboard(user_id)
    return result


@router.post("/roadmap", summary="Generate Roadmap", tags=["Learning Path"])
async def generate_roadmap(request: GenerateRoadmapRequest):
    """
    Generate a complete onboarding roadmap document.
    
    This is perfect for printing, sharing with managers, or using
    as a reference during onboarding.
    """
    orchestrator = get_orchestrator()
    result = await orchestrator.get_onboarding_roadmap(
        session_id=request.session_id,
        role=request.role
    )
    return result


@router.get("/session/{session_id}", summary="Get Session Status", tags=["Session"])
async def get_session_status(session_id: str):
    """
    Get current status of an onboarding session.
    """
    orchestrator = get_orchestrator()
    result = orchestrator.get_session_status(session_id)
    return result


@router.get("/leaderboard", summary="Get Leaderboard", tags=["Gamification"])
async def get_leaderboard(limit: int = 10):
    """
    Get XP leaderboard for gamification.
    
    Perfect for team motivation and friendly competition!
    """
    orchestrator = get_orchestrator()
    return {
        "leaderboard": orchestrator.progress_coach.get_leaderboard(limit)
    }


@router.get("/team-analytics", summary="Get Team Analytics", tags=["Analytics"])
async def get_team_analytics(user_ids: str):
    """
    Get team-wide onboarding analytics for managers.
    
    Pass user_ids as comma-separated string.
    
    Returns:
    - Team completion metrics
    - Velocity distribution
    - Individual progress
    - Actionable insights
    """
    user_id_list = [uid.strip() for uid in user_ids.split(",")]
    
    orchestrator = get_orchestrator()
    return orchestrator.progress_coach.get_team_analytics(user_id_list)


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health", summary="Health Check", tags=["System"])
async def health_check():
    """Check if the onboarding API is running."""
    return {
        "status": "healthy",
        "service": "CodeFlow Onboarding API",
        "version": "2.0.0",
        "agents": [
            "CodebaseArchitect",
            "LearningPathArchitect", 
            "InteractiveTutor",
            "TaskGenerator",
            "ProgressCoach"
        ]
    }
