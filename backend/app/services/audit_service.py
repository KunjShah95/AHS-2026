from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.models.sqlalchemy_models import AuditLog, User


class AuditService:
    @staticmethod
    async def log(
        session: AsyncSession,
        user_id: Optional[str],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        audit_entry = AuditLog(
            id=uuid.uuid4(),
            user_id=uuid.UUID(user_id) if user_id else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow(),
        )
        session.add(audit_entry)
        return audit_entry

    @staticmethod
    async def get_user_audit_logs(
        session: AsyncSession, user_id: str, limit: int = 100, offset: int = 0
    ) -> List[AuditLog]:
        result = await session.execute(
            select(AuditLog)
            .where(AuditLog.user_id == uuid.UUID(user_id))
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    @staticmethod
    async def get_resource_audit_logs(
        session: AsyncSession, resource_type: str, resource_id: str, limit: int = 100
    ) -> List[AuditLog]:
        result = await session.execute(
            select(AuditLog)
            .where(
                AuditLog.resource_type == resource_type,
                AuditLog.resource_id == resource_id,
            )
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def cleanup_old_logs(session: AsyncSession, days: int = 90):
        from sqlalchemy import delete as sqlalchemy_delete
        from datetime import timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days)
        result = await session.execute(
            sqlalchemy_delete(AuditLog).where(AuditLog.created_at < cutoff_date)
        )
        return result.rowcount


audit_service = AuditService()
