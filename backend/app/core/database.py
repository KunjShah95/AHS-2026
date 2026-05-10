"""
Database Configuration
======================
Provides both Firestore (NoSQL) and PostgreSQL (SQL) database connections.
"""

import firebase_admin
from firebase_admin import firestore
import logging
from sqlalchemy.orm import Session

# Import SQLAlchemy components from database_pool
from app.core.database_pool import (
    Base,
    get_sync_session,
    get_async_session,
    get_session_factory,
)

logger = logging.getLogger(__name__)

# Firestore client
def get_firestore_client():
    """Get Firestore database client."""
    try:
        # App should already be initialized by app.core.security or main
        # But we ensure we get the client
        return firestore.client()
    except ValueError as e:
        logger.error(f"Firestore client init failed (App likely not initialized): {e}")
        # Fallback or re-init logic if needed, but security.py handles init
        raise e


# PostgreSQL/SQLAlchemy session factory (for synchronous usage)
SessionLocal = get_session_factory()


def get_db() -> Session:
    """
    FastAPI dependency for getting synchronous database session.
    
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
