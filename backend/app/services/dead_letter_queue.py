from typing import List, Dict, Any, Optional
from datetime import datetime
import json
from loguru import logger
from app.core.config import settings


class DeadLetterQueue:
    def __init__(self, redis_key: str = "dlq:tasks"):
        self.redis_key = redis_key
        self.max_size = 10000

    async def add(
        self,
        task_name: str,
        task_args: Dict[str, Any],
        task_kwargs: Dict[str, Any],
        error: str,
        traceback: str,
        attempts: int,
    ):
        entry = {
            "task_name": task_name,
            "task_args": task_args,
            "task_kwargs": task_kwargs,
            "error": error,
            "traceback": traceback,
            "attempts": attempts,
            "timestamp": datetime.utcnow().isoformat(),
            "failed_at": datetime.utcnow().isoformat(),
        }

        try:
            from app.core.redis_manager import redis_client

            if redis_client:
                await redis_client.lpush(self.redis_key, json.dumps(entry))
                size = await redis_client.llen(self.redis_key)
                if size > self.max_size:
                    await redis_client.ltrim(self.redis_key, 0, self.max_size - 1)
                logger.warning(
                    f"Task {task_name} added to DLQ after {attempts} attempts"
                )
        except Exception as e:
            logger.error(f"Failed to add to DLQ: {e}")

    async def get_all(self, start: int = 0, end: int = -1) -> List[Dict[str, Any]]:
        try:
            from app.core.redis_manager import redis_client

            if redis_client:
                items = await redis_client.lrange(self.redis_key, start, end)
                return [json.loads(item) for item in items]
        except Exception as e:
            logger.error(f"Failed to get DLQ items: {e}")
        return []

    async def get_count(self) -> int:
        try:
            from app.core.redis_manager import redis_client

            if redis_client:
                return await redis_client.llen(self.redis_key)
        except Exception as e:
            logger.error(f"Failed to get DLQ count: {e}")
        return 0

    async def clear(self) -> int:
        try:
            from app.core.redis_manager import redis_client

            if redis_client:
                return await redis_client.delete(self.redis_key)
        except Exception as e:
            logger.error(f"Failed to clear DLQ: {e}")
        return 0

    async def retry_task(self, index: int) -> bool:
        try:
            from app.core.redis_manager import redis_client

            if redis_client:
                items = await redis_client.lrange(self.redis_key, index, index)
                if items:
                    entry = json.loads(items[0])
                    from app.tasks.celery_app import celery_app

                    celery_app.send_task(
                        entry["task_name"],
                        args=[entry["task_args"]],
                        kwargs=entry["task_kwargs"],
                        task_id=f"retry_{datetime.utcnow().timestamp()}",
                    )
                    await redis_client.lrem(self.redis_key, 1, items[0])
                    return True
        except Exception as e:
            logger.error(f"Failed to retry task: {e}")
        return False


dlq = DeadLetterQueue()


def setup_dead_letter_queue():
    return dlq
