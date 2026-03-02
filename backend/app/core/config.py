from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    VERSION: str = "2.0.0"

    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project")
    GOOGLE_CLOUD_LOCATION: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    VERTEX_AI_ENDPOINT: str = os.getenv("VERTEX_AI_ENDPOINT", "")

    # Multi-Provider AI Configuration
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    VERCEL_AI_API_KEY: str = os.getenv("VERCEL_AI_API_KEY", "")
    VERCEL_AI_BASE_URL: str = os.getenv(
        "VERCEL_AI_BASE_URL", "https://api.vercel.ai/v1"
    )

    # Default AI Model (uses OpenRouter by default - best pricing)
    DEFAULT_AI_MODEL: str = os.getenv(
        "DEFAULT_AI_MODEL", "openrouter/meta-llama/llama-3.3-70b-instruct"
    )

    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://user:pass@localhost:5432/codeflow"
    )
    ASYNC_DATABASE_URL: str = os.getenv(
        "ASYNC_DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/codeflow"
    )

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-min-32-chars")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    API_KEY_ENCRYPTION_KEY: str = os.getenv(
        "API_KEY_ENCRYPTION_KEY", "your-encryption-key-32-chars"
    )

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback"
    )

    AZURE_TENANT_ID: str = os.getenv("AZURE_TENANT_ID", "")
    AZURE_CLIENT_ID: str = os.getenv("AZURE_CLIENT_ID", "")
    AZURE_CLIENT_SECRET: str = os.getenv("AZURE_CLIENT_SECRET", "")

    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")

    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN", "")
    ELASTICSEARCH_URL: str = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
    ELASTICSEARCH_INDEX: str = os.getenv("ELASTICSEARCH_INDEX", "codeflow_search")

    GCP_STORAGE_BUCKET: str = os.getenv("GCP_STORAGE_BUCKET", "codeflow-files")

    RESEND_API_KEY: Optional[str] = os.getenv("RESEND_API_KEY", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@codeflow.ai")
    FROM_NAME: str = os.getenv("FROM_NAME", "CodeFlow")

    OPENAPI_URL: str = "/openapi.json"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
