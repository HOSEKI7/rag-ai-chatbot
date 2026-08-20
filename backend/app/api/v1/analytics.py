from fastapi import APIRouter
from app.services.analytics import get_analytics_service, AggregatedMetrics

router = APIRouter()


@router.get("/analytics", response_model=AggregatedMetrics)
async def get_analytics() -> AggregatedMetrics:
    """
    Get aggregated RAG observability metrics, query traffic volume,
    confidence score statistics, rejected queries, and latency breakdowns.
    """
    analytics_service = get_analytics_service()
    return analytics_service.get_aggregated_metrics()
