from datetime import datetime
from typing import Optional, Dict, Any
import json
from loguru import logger
from app.core.config import settings


class SentryClient:
    def __init__(self, dsn: Optional[str] = None):
        self.dsn = dsn or settings.SENTRY_DSN
        self._initialized = False
    
    def init(self):
        if self.dsn:
            try:
                import sentry_sdk
                sentry_sdk.init(
                    dsn=self.dsn,
                    traces_sample_rate=1.0,
                    profiles_sample_rate=1.0,
                    environment=settings.ENVIRONMENT,
                    release=settings.VERSION,
                )
                self._initialized = True
                logger.info("Sentry initialized successfully")
            except ImportError:
                logger.warning("Sentry SDK not installed, skipping initialization")
            except Exception as e:
                logger.error(f"Failed to initialize Sentry: {e}")
    
    def capture_exception(self, exception: Exception, extra: Optional[Dict[str, Any]] = None):
        if self._initialized:
            import sentry_sdk
            with sentry_sdk.configure_scope() as scope:
                if extra:
                    for key, value in extra.items():
                        scope.set_extra(key, value)
                sentry_sdk.capture_exception(exception)
        logger.exception(f"Exception captured: {exception}")
    
    def capture_message(self, message: str, level: str = "info", extra: Optional[Dict]] = None):
        if self._initialized:
            import sentry_sdk
            with sentry_sdk.configure_scope() as scope:
                if extra:
                    for key, value in extra.items():
                        scope.set_extra(key, value)
                sentry_sdk.capture_message(message, level)
        logger.log(getattr(logger, level.upper(), logger.info), message)
    
    def set_user(self, user_id: str, email: Optional[str] = None, extra: Optional[Dict] = None):
        if self._initialized:
            import sentry_sdk
            user_data = {"id": user_id}
            if email:
                user_data["email"] = email
            if extra:
                user_data.update(extra)
            sentry_sdk.set_user(user_data)
    
    def set_tag(self, key: str, value: str):
        if self._initialized:
            import sentry_sdk
            sentry_sdk.set_tag(key, value)
    
    def set_context(self, name: str, context: Dict[str, Any]):
        if self._initialized:
            import sentry_sdk
            sentry_sdk.set_context(name, context)


sentry_client = SentryClient()


def setup_error_tracking():
    sentry_client.init()
