import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "VYRON AI"
    APP_ENV: str = "development"
    SECRET_KEY: str = "vyron-ai-super-secret-key-change-in-production-min-32-chars"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    DATABASE_URL: str = "sqlite:///./vyron.db"

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    STORAGE_PROVIDER: str = "local"
    STORAGE_BUCKET_NAME: str = "vyron-assets"
    STORAGE_ENDPOINT_URL: str = ""
    STORAGE_ACCESS_KEY_ID: str = ""
    STORAGE_SECRET_ACCESS_KEY: str = ""
    STORAGE_PUBLIC_URL: str = "http://localhost:8000/static"

    DEFAULT_AI_PROVIDER: str = "mock_engine"
    KLING_API_KEY: str = ""
    KLING_API_BASE_URL: str = "https://api.klingai.com/v1"
    RUNWAY_API_KEY: str = ""
    RUNWAY_API_BASE_URL: str = "https://api.runwayml.com/v1"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
