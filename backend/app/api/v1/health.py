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
    """Health check endpoint to probe service status and connectivity."""
    connectivity_status = {
        "api": "connected",
        "runtime": "python-fastapi",
    }

    return HealthResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        connectivity=connectivity_status,
    )
