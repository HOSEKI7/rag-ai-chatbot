import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.services.chunker import ParentChunk, ChildChunk
from app.services.vector_store import VectorStoreService


@pytest.fixture
def test_vector_store():
    store = VectorStoreService(location=":memory:", collection_name="test_retrieve_api_store")
    store.ensure_collection(vector_size=384)

    parent = ParentChunk(
        id="doc-abb-p001",
        document_id="doc-abb-vfd-acs580",
        document_title="ABB ACS580 VFD Manual",
        category="Drive",
        section_title="Technical Ratings",
        text="The ABB ACS580 general purpose drive delivers 37 kW output at 400V 3-phase with Modbus RTU interface standard.",
        token_count=26,
        is_table=False,
        page_number=12,
    )

    child = ChildChunk(
        id="doc-abb-p001-c001",
        parent_id="doc-abb-p001",
        document_id="doc-abb-vfd-acs580",
        document_title="ABB ACS580 VFD Manual",
        category="Drive",
        section_title="Technical Ratings",
        text="[ABB ACS580 VFD Manual > Technical Ratings]\nABB ACS580 drive 37 kW 400V 3-phase with Modbus RTU communication.",
        token_count=20,
        is_table=False,
        page_number=12,
    )

    from app.services.embedding import get_embedding_service
    embedder = get_embedding_service()
    vector = embedder.embed_documents([child.text])[0]

    store.upsert_chunks(parents=[parent], children=[child], embeddings=[vector])
    return store


@pytest.mark.asyncio
async def test_post_retrieve_endpoint_in_scope(test_vector_store, monkeypatch):
    """Verify POST /api/v1/retrieve returns top reranked chunks and reconstructed context."""
    monkeypatch.setattr("app.services.retrieval_pipeline.get_vector_store", lambda: test_vector_store)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        req_payload = {
            "query": "What is the rated power and communication interface of the ABB ACS580 drive?",
            "confidence_threshold": 0.60,
            "limit": 3,
        }

        response = await client.post("/api/v1/retrieve", json=req_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["passed_guardrail"] is True
        assert data["confidence_score"] >= 0.60
        assert data["refusal_message"] is None
        assert len(data["chunks"]) >= 1
        assert "ABB ACS580" in data["reconstructed_context"]
        assert len(data["citations"]) >= 1
        assert data["citations"][0]["page_number"] == 12


@pytest.mark.asyncio
async def test_post_retrieve_endpoint_out_of_scope(test_vector_store, monkeypatch):
    """Verify POST /api/v1/retrieve refuses out of scope queries with confidence refusal."""
    monkeypatch.setattr("app.services.retrieval_pipeline.get_vector_store", lambda: test_vector_store)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        req_payload = {
            "query": "How to bake a sourdough bread at home?",
            "confidence_threshold": 0.65,
        }

        response = await client.post("/api/v1/retrieve", json=req_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["passed_guardrail"] is False
        assert data["confidence_score"] < 0.65
        assert data["refusal_message"] is not None
        assert data["reconstructed_context"] == ""
