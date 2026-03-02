"""
CodeFlow - Database Connection Pooling
========================================

Production-ready PostgreSQL connection pooling with async SQLAlchemy.
Optimized for high-concurrency workloads.
"""

import logging
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import QueuePool, AsyncAdaptedQueuePool

from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

_sync_engine = None
_async_engine = None
_sync_session_factory = None
_async_session_factory = None


def get_sync_engine():
    """Get or create synchronous SQLAlchemy engine."""
    global _sync_engine
    if _sync_engine is None:
        _sync_engine = create_engine(
            settings.DATABASE_URL,
            poolclass=QueuePool,
            pool_size=20,
            max_overflow=40,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=settings.DEBUG,
            logging_name="sqlalchemy.sync",
        )
        logger.info(f"Created sync engine with pool size=20, max_overflow=40")
    return _sync_engine


def get_async_engine():
    """Get or create asynchronous SQLAlchemy engine."""
    global _async_engine
    if _async_engine is None:
        _async_engine = create_async_engine(
            settings.ASYNC_DATABASE_URL,
            pool_size=20,
            max_overflow=40,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=settings.DEBUG,
            logging_name="sqlalchemy.async",
        )
        logger.info(f"Created async engine with pool size=20, max_overflow=40")
    return _async_engine


def get_session_factory() -> sessionmaker:
    """Get synchronous session factory."""
    global _sync_session_factory
    if _sync_session_factory is None:
        engine = get_sync_engine()
        _sync_session_factory = sessionmaker(
            bind=engine, autocommit=False, autoflush=False
        )
    return _sync_session_factory


def get_async_session_factory() -> async_sessionmaker:
    """Get async session factory."""
    global _async_session_factory
    if _async_session_factory is None:
        engine = get_async_engine()
        _async_session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,
        )
    return _async_session_factory


@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Get async database session with proper cleanup."""
    factory = get_async_session_factory()
    session = factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


def get_sync_session() -> Session:
    """Get synchronous database session."""
    factory = get_session_factory()
    return factory()


@event.listens_for(get_sync_engine(), "connect")
def set_session_vars(dbapi_connection, connection_record):
    """Set session variables on connection."""
    cursor = dbapi_connection.cursor()
    cursor.execute("SET statement_timeout = '30s'")
    cursor.execute("SET idle_in_transaction_session_timeout = '60000'")
    cursor.close()


class ConnectionPoolMetrics:
    """Monitor connection pool metrics."""

    @staticmethod
    def get_sync_pool_stats() -> dict:
        """Get synchronous pool statistics."""
        engine = get_sync_engine()
        pool = engine.pool
        return {
            "size": pool.size(),
            "connections_in_use": pool.checkedin(),
            "connections_available": pool.checkout(),
            "overflow": pool.overflow(),
            "total_checkouts": pool.checkouts(),
            "timeout_checkouts": pool.timeout_checkouts(),
            "checkin_count": pool.checkins(),
            "bad_connection_count": pool.bad_connections(),
        }

    @staticmethod
    async def get_async_pool_stats() -> dict:
        """Get async pool statistics."""
        engine = get_async_engine()
        pool = engine.pool
        return {
            "size": pool.size(),
            "overflow": pool.overflow(),
            "checkouts": pool.checkouts(),
            "checkins": pool.checkins(),
        }


async def check_db_connection() -> bool:
    """Check if database connection is healthy."""
    try:
        async with get_async_session() as session:
            await session.execute("SELECT 1")
            return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False


async def close_all_connections():
    """Close all database connections gracefully."""
    global _sync_engine, _async_engine

    if _async_engine:
        await _async_engine.dispose()
        _async_engine = None
        logger.info("Async database connections closed")

    if _sync_engine:
        _sync_engine.dispose()
        _sync_engine = None
        logger.info("Sync database connections closed")
