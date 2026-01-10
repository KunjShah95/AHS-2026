
import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import json

# Initialize Firebase Admin
# Attempt to use serviceAccountKey.json if it exists, otherwise rely on GOOGLE_APPLICATION_CREDENTIALS or default defaults

def initialize_firebase():
    try:
        if not firebase_admin._apps:
            cred_path = os.getenv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print(f"Firebase Admin initialized with credentials from {cred_path}")
            else:
                # Fallback to default credentials (e.g. GCLOUD_PROJECT env var or gcloud auth application-default login)
                print("Firebase Admin initialized with default credentials")
                firebase_admin.initialize_app()
    except Exception as e:
        print(f"Failed to initialize Firebase Admin: {e}")

initialize_firebase()

security = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    token = creds.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
