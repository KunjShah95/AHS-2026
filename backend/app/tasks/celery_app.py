"""
CodeFlow - Celery Async Task Processing
========================================

Production-ready Celery configuration for async task processing.

Features:
- Task queues with priorities
- Retry with exponential backoff
- Task routing
- Rate limiting
- Monitoring integration

Usage:
    from app.tasks.celery_app import celery_app, send_task

    @celery_app.task
    def my_task(data):
        # Process data
        return result

    # Or use helper:
    result = await send_task("my_queue", my_task, data)
"""

import os
import logging
from typing import Any, Dict, Optional, Callable
from celery import Celery, Task
from celery.exceptions import MaxRetriesExceededError
from celery.schedules import crontab

logger = logging.getLogger(__name__)


# Celery Configuration
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

CELERY_RESULT_URL = os.getenv("CELERY_RESULT_URL", "redis://localhost:6379/1")

celery_app = Celery(
    "codeflow_tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_URL,
    include=["app.tasks.agents", "app.tasks.analytics", "app.tasks.notifications"],
)

# Celery Configuration Settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.tasks.agents.*": {"queue": "agent-tasks"},
        "app.tasks.analytics.*": {"queue": "analytics-tasks"},
        "app.tasks.notifications.*": {"queue": "notification-tasks"},
    },
    task_queues={
        "agent-tasks": {
            "exchange": "agent-tasks",
            "routing_key": "agent.#",
            "queue_arguments": {"x-max-priority": 10},
        },
        "analytics-tasks": {
            "exchange": "analytics-tasks",
            "routing_key": "analytics.#",
        },
        "notification-tasks": {
            "exchange": "notification-tasks",
            "routing_key": "notification.#",
        },
        "default": {"exchange": "default", "routing_key": "default"},
    },
    task_default_queue="default",
    task_default_priority=5,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
    task_soft_time_limit=300,
    task_time_limit=360,
    result_expires=86400,
    result_compressed=True,
    task_sends_event_message=True,
    worker_send_task_events=True,
    task_track_started=True,
    beat_schedule={
        "cleanup-expired-sessions": {
            "task": "app.tasks.maintenance.cleanup_expired_sessions",
            "schedule": crontab(hour=3, minute=0),
        },
        "generate-analytics-daily": {
            "task": "app.tasks.analytics.generate_daily_report",
            "schedule": crontab(hour=4, minute=0),
        },
    },
)


class BaseCodeflowTask(Task):
    """Base task class with common functionality."""

    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure."""
        logger.error(f"Task {task_id} failed: {exc}", exc_info=einfo)

    def on_success(self, retval, task_id, args, kwargs):
        """Handle task success."""
        logger.info(f"Task {task_id} completed successfully")


def create_task(
    queue: str = "default",
    max_retries: int = 3,
    default_retry_delay: int = 60,
    time_limit: Optional[int] = None,
) -> Callable:
    """
    Decorator to create a CodeFlow task with standard configuration.

    Args:
        queue: Queue name for routing
        max_retries: Maximum retry attempts
        default_retry_delay: Initial retry delay (seconds)
        time_limit: Hard time limit (seconds)

    Usage:
        @create_task(queue="agent-tasks", max_retries=3)
        def my_task(data):
            return process(data)
    """

    def decorator(func: Callable) -> Callable:
        app_task = celery_app.task(
            base=BaseCodeflowTask,
            queue=queue,
            max_retries=max_retries,
            default_retry_delay=default_retry_delay,
            time_limit=time_limit,
            bind=True,
        )(func)
        return app_task

    return decorator


async def send_task(
    queue: str,
    task_func: str,
    payload: Dict[str, Any],
    priority: int = 5,
    countdown: Optional[int] = None,
    expires: Optional[int] = None,
) -> str:
    """
    Send a task asynchronously.

    Args:
        queue: Target queue name
        task_func: Task function path (e.g., "app.tasks.agents.analyze_repository")
        payload: Task payload data
        priority: Task priority (1-10, 10 is highest)
        countdown: Delay before execution (seconds)
        expires: Task expiration (seconds)

    Returns:
        Task ID
    """
    task_id = celery_app.send_task(
        task_func,
        args=[payload],
        queue=queue,
        priority=priority,
        countdown=countdown,
        expires=expires,
    )

    logger.info(f"Task sent to {queue}: {task_id}")
    return str(task_id)


# Import task modules to register them
from app.tasks import agents  # noqa
from app.tasks import analytics  # noqa
from app.tasks import notifications  # noqa
from app.tasks import maintenance  # noqa


@celery_app.task(bind=True, base=BaseCodeflowTask)
def debug_task(self, message: str) -> str:
    """Debug task for testing."""
    logger.info(f"Debug task received: {message}")
    return f"Processed: {message}"


if __name__ == "__main__":
    celery_app.start()
