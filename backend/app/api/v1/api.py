from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.ingest import router as ingest_router
from app.api.v1.retrieve import router as retrieve_router
from app.api.v1.chat import router as chat_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(ingest_router, tags=["Ingestion & Documents"])
api_router.include_router(retrieve_router, tags=["Retrieval & Guardrail"])
api_router.include_router(chat_router, tags=["Chat & Generation"])
