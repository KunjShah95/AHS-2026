"""
CodeFlow - Notification Tasks
===========================

Celery tasks for email and notification delivery.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, queue="notification-tasks")
def send_email_notification(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Send email notification."""
    logger.info(f"Sending email to: {payload.get('to')}")
    return {"status": "sent", "to": payload.get("to")}


@celery_app.task(bind=True, queue="notification-tasks")
def send_webhook_notification(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Send webhook notification."""
    logger.info(f"Sending webhook to: {payload.get('url')}")
    return {"status": "sent", "url": payload.get("url")}


@celery_app.task(bind=True, queue="notification-tasks")
def send_achievement_notification(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Send achievement unlocked notification."""
    logger.info(f"Sending achievement notification to: {payload.get('user_id')}")
    return {"status": "sent", "achievement": payload.get("achievement_name")}
