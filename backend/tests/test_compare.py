import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.compare_service import compare_documents_pipeline, CompareRequest

client = TestClient(app)


def test_compare_documents_pipeline():
    result = compare_documents_pipeline(
        doc_ids=["doc_siemens_1le1", "doc_abb_acs580"],
        query="Compare power and operating voltage ratings",
    )
    assert result.status == "success"
    assert len(result.compared_documents) == 2
    assert result.reconstructed_context is not None
    assert "comparison_context" in result.reconstructed_context
    assert "markdown comparison table" in result.user_prompt


def test_compare_api_endpoint():
    response = client.post(
        "/api/v1/compare",
        json={
            "doc_ids": ["doc_siemens_1le1", "doc_abb_acs580"],
            "query": "Compare technical ratings and efficiency",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "compared_documents" in data
    assert "reconstructed_context" in data
    assert "system_prompt" in data
    assert "user_prompt" in data


def test_chat_api_multi_document_comparison():
    response = client.post(
        "/api/v1/chat",
        json={
            "query": "Compare Siemens 1LE1 vs ABB ACS580",
            "filter_doc_ids": ["doc_siemens_1le1", "doc_abb_acs580"],
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
