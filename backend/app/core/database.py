import firebase_admin
from firebase_admin import firestore
import logging

logger = logging.getLogger(__name__)

def get_firestore_client():
    try:
        # App should already be initialized by app.core.security or main
        # But we ensure we get the client
        return firestore.client()
    except ValueError as e:
        logger.error(f"Firestore client init failed (App likely not initialized): {e}")
        # Fallback or re-init logic if needed, but security.py handles init
        raise e
