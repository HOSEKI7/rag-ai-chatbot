from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Contexure Backend"
    SERVICE_NAME: str = "contexure-backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ]

    # External APIs (Optional defaults for scaffolding)
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "industrial_datasheets"

    # Ingestion / Guardrail Defaults
    CONFIDENCE_THRESHOLD: float = 0.65
    TOP_K_RETRIEVAL: int = 20
    TOP_K_RERANK: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
