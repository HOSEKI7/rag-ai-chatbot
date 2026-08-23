import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-warm AI models and database connections during startup for instant request handling."""
    try:
        from app.services.embedding import get_embedding_service
        from app.services.reranker import get_reranker_service
        from app.services.vector_store import get_vector_store

        logger.info("Pre-warming embedding service...")
        embedder = get_embedding_service()
        embedder.embed_query("warmup")

        logger.info("Pre-warming reranker service...")
        get_reranker_service()

        logger.info("Pre-warming vector store connection...")
        get_vector_store()

        logger.info("All RAG pipelines pre-warmed successfully.")
    except Exception as e:
        logger.warning(f"Error during startup pre-warming: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS configuration
explicit_origins = [str(o).strip() for o in settings.BACKEND_CORS_ORIGINS if "*" not in str(o)]
app.add_middleware(
    CORSMiddleware,
    allow_origins=explicit_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Contexure RAG API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
