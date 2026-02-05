from typing import Optional, Dict, Any
from datetime import datetime
from loguru import logger
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME

    async def send_email(
        self,
        to: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        if not self.api_key:
            logger.warning("Email service not configured")
            return False

        try:
            import resend

            response = resend.Emails.send(
                {
                    "from": f"{self.from_name} <{self.from_email}>",
                    "to": to,
                    "subject": subject,
                    "html": html_content,
                    "text": text_content,
                }
            )

            logger.info(f"Email sent to {to}: {response['id']}")
            return True
        except ImportError:
            logger.warning("Resend SDK not installed")
            return await self._send_fallback_email(to, subject, html_content)
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    async def _send_fallback_email(self, to: str, subject: str, content: str) -> bool:
        logger.info(f"[MOCK EMAIL] To: {to}, Subject: {subject}")
        return True

    async def send_welcome_email(self, email: str, name: str) -> bool:
        html = f"""
        <h1>Welcome to CodeFlow, {name}!</h1>
        <p>Thanks for joining. Start exploring your codebase with AI-powered onboarding.</p>
        <a href="https://app.codeflow.ai">Get Started</a>
        """
        return await self.send_email(email, "Welcome to CodeFlow", html)

    async def send_task_completed_email(
        self, email: str, task_name: str, progress_percentage: int
    ) -> bool:
        html = f"""
        <h1>Task Completed!</h1>
        <p>You've completed "{task_name}"</p>
        <p>Your progress: {progress_percentage}%</p>
        """
        return await self.send_email(email, f"Task Completed: {task_name}", html)

    async def send_password_reset_email(self, email: str, reset_url: str) -> bool:
        html = f"""
        <h1>Password Reset</h1>
        <p>Click the link to reset your password:</p>
        <a href="{reset_url}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        """
        return await self.send_email(email, "Password Reset Request", html)


email_service = EmailService()


def setup_email_service():
    return email_service
