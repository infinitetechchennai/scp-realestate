import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "SCP Real Estate"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "scp_super_secret_jwt_key_2026_change_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "scp"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "1234"
    
    DATABASE_URL: str = "postgresql+psycopg2://postgres:1234@localhost:5432/scp"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
