import os
from pathlib import Path
from typing import List, Union, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

# Locate backend/.env file dynamically
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    # Application & Security Config
    PROJECT_NAME: str = "Seven Circle Property API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "generate-a-strong-random-secret-key-here-minimum-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # PostgreSQL Database Connection
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "1234"
    POSTGRES_DB: str = "scp_realestate"
    DB_SCHEMA: str = "app"

    DATABASE_URL: Optional[str] = None
    DATABASE_ASYNC_URL: Optional[str] = None
    SYNC_DATABASE_URL: Optional[str] = None

    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000"]

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    STORAGE_PROVIDER: str = "local"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                return ["http://localhost:5173", "http://localhost:3000"]
        return v

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

settings = Settings()
