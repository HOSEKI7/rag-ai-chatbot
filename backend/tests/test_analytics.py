import pytest
from app.services.analytics import get_analytics_service, QueryTrace
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_analytics_record_and_aggregate():
    service = get_analytics_service()
    service.clear_traces()

    # Record sample traces
    service.record_trace(
        QueryTrace(
            query="What is the rated power of Siemens 1LE1?",
            latency_ms=450.0,
            retrieval_latency_ms=120.0,
            generation_latency_ms=330.0,
            confidence_score=0.88,
            passed_guardrail=True,
            provider="gemini",
            retrieved_documents=["doc_siemens_1le1"],
            refusal_reason=None,
        )
    )

    service.record_trace(
        QueryTrace(
            query="How to cook pasta bolognese?",
            latency_ms=110.0,
            retrieval_latency_ms=110.0,
            generation_latency_ms=0.0,
            confidence_score=0.22,
            passed_guardrail=False,
            provider="refusal",
            retrieved_documents=[],
            refusal_reason="Confidence score 0.22 below 0.65 threshold",
        )
    )

    stats = service.get_aggregated_metrics()
    assert stats.total_queries == 2
    assert stats.successful_queries == 1
    assert stats.rejected_queries_count == 1
    assert stats.average_confidence_score == pytest.approx(0.55, 0.01)
    assert stats.provider_distribution.get("gemini") == 1
    assert stats.provider_distribution.get("refusal") == 1
    assert len(stats.rejected_queries) == 1
    assert stats.rejected_queries[0].query == "How to cook pasta bolognese?"


def test_get_analytics_endpoint():
    service = get_analytics_service()
    service.clear_traces()

    service.record_trace(
        QueryTrace(
            query="ABB ACS580 operating temperature",
            latency_ms=380.0,
            retrieval_latency_ms=90.0,
            generation_latency_ms=290.0,
            confidence_score=0.91,
            passed_guardrail=True,
            provider="gemini",
            retrieved_documents=["doc_abb_acs580"],
            refusal_reason=None,
        )
    )

    response = client.get("/api/v1/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_queries"] >= 1
    assert "provider_distribution" in data
    assert "rejected_queries" in data
