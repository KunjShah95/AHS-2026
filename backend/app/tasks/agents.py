"""
CodeFlow - Agent Tasks for Celery
==================================

Celery tasks for async agent processing.

Tasks:
- analyze_repository: Long-running repository analysis
- generate_quiz: Quiz generation
- generate_learning_path: Learning path generation
"""

import logging
import asyncio
from typing import Dict, Any

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async coroutine in sync context."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, queue="agent-tasks")
def analyze_repository_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze repository asynchronously.

    This task runs in background to avoid timeout issues.

    Args:
        payload: {
            "repository_url": str,
            "user_id": str,
            "session_id": str,
            "file_tree": list
        }

    Returns:
        Analysis results
    """
    from app.agents.adk_orchestrator import get_adk_orchestrator

    try:
        orchestrator = get_adk_orchestrator()

        result = run_async(
            orchestrator.start_onboarding(
                user_id=payload["user_id"],
                repository_url=payload["repository_url"],
                file_tree=payload.get("file_tree", []),
                developer_level=payload.get("developer_level", "junior"),
                time_available=payload.get("time_available", "2 weeks"),
            )
        )

        return {
            "success": result.get("success", False),
            "session_id": result.get("session_id"),
            "analysis": result.get("architecture_summary", {}),
            "error": result.get("error"),
        }

    except Exception as e:
        logger.error(f"Repository analysis failed: {e}")

        retry_delay = 2**self.request.retries
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=retry_delay)

        return {"success": False, "error": str(e), "retries": self.request.retries}


@celery_app.task(bind=True, max_retries=3, queue="agent-tasks")
def generate_quiz_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate quiz questions asynchronously.

    Args:
        payload: {
            "session_id": str,
            "module_id": str,
            "topic": str,
            "difficulty": str,
            "count": int
        }

    Returns:
        Generated quiz questions
    """
    from app.agents.adk_orchestrator import get_adk_orchestrator

    try:
        orchestrator = get_adk_orchestrator()
        tutor = orchestrator.get_agent("interactive_tutor")

        result = run_async(
            tutor.execute(
                task_id=f"quiz_{payload['session_id']}_{payload['module_id']}",
                task={
                    "action": "generate_quiz",
                    "topic": payload["topic"],
                    "difficulty": payload["difficulty"],
                    "count": payload.get("count", 5),
                },
                context={},
            )
        )

        return {
            "success": True,
            "questions": result.get("result", {}).get("questions", []),
            "session_id": payload["session_id"],
        }

    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        retry_delay = 2**self.request.retries
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=retry_delay)

        return {"success": False, "error": str(e)}


@celery_app.task(bind=True, max_retries=2, queue="agent-tasks")
def generate_learning_path_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate learning path asynchronously.

    Args:
        payload: {
            "session_id": str,
            "architecture_analysis": dict,
            "developer_level": str,
            "time_available": str
        }

    Returns:
        Generated learning path
    """
    from app.agents.adk_orchestrator import get_adk_orchestrator

    try:
        orchestrator = get_adk_orchestrator()
        learning_agent = orchestrator.get_agent("learning_path_architect")

        result = run_async(
            learning_agent.execute(
                task_id=f"path_{payload['session_id']}",
                task={
                    "action": "generate",
                    "architecture_analysis": payload.get("architecture_analysis", {}),
                    "developer_level": payload.get("developer_level", "junior"),
                    "time_available": payload.get("time_available", "2 weeks"),
                },
                context={},
            )
        )

        return {
            "success": True,
            "learning_path": result.get("result", {}),
            "session_id": payload["session_id"],
        }

    except Exception as e:
        logger.error(f"Learning path generation failed: {e}")
        retry_delay = 2**self.request.retries
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=retry_delay)

        return {"success": False, "error": str(e)}


@celery_app.task(bind=True, max_retries=3, queue="agent-tasks")
def track_progress_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Track user progress asynchronously.

    Args:
        payload: {
            "user_id": str,
            "task_id": str,
            "task_title": str,
            "completed": bool,
            "time_spent": int,
            "difficulty": int
        }

    Returns:
        Updated progress stats
    """
    from app.agents.adk_orchestrator import get_adk_orchestrator

    try:
        orchestrator = get_adk_orchestrator()
        coach = orchestrator.get_agent("progress_coach")

        result = run_async(
            coach.execute(
                task_id=f"progress_{payload['user_id']}_{payload['task_id']}",
                task={
                    "action": "track",
                    "user_id": payload["user_id"],
                    "task_id": payload["task_id"],
                    "task_title": payload.get("task_title", ""),
                    "time_spent_minutes": payload.get("time_spent", 0),
                    "difficulty": payload.get("difficulty", 3),
                },
                context={},
            )
        )

        return {
            "success": True,
            "progress": result.get("result", {}),
            "user_id": payload["user_id"],
        }

    except Exception as e:
        logger.error(f"Progress tracking failed: {e}")
        return {"success": False, "error": str(e)}
