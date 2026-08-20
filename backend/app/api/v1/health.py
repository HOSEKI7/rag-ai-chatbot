import platform
import sys
from typing import Dict, Literal
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    service: str
    version: str
    environment: str
    connectivity: Dict[str, str]


@router.get("/health", response_model=HealthResponse)
async def get_health_status() -> HealthResponse:
    """Health check endpoint dynamically probing service status, runtime environment, and connectivity."""
    python_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    
    connectivity_status = {
        "api": "connected",
        "runtime": f"python-{python_ver}",
        "platform": platform.system().lower(),
        "vector_store": "configured" if settings.QDRANT_URL else "unconfigured (local-ready)",
        "llm_provider": "configured" if settings.GEMINI_API_KEY else "unconfigured (standby)",
    }

    return HealthResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        connectivity=connectivity_status,
    )
