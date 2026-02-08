"""
VitalFlow AI Service Configuration
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # API Keys
    GEMINI_API_KEY: str = ""

    # Service Configuration
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 10
    RATE_LIMIT_PERIOD: int = 60  # seconds

    # AI Configuration
    AI_TEMPERATURE: float = 0.7
    AI_MAX_TOKENS: int = 8192

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
