import json
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.services.chunker import ParentChunk, ChildChunk
from app.services.vector_store import VectorStoreService


@pytest.fixture
def populated_vector_store():
    store = VectorStoreService(location=":memory:", collection_name="test_chat_store")
    store.ensure_collection(vector_size=768)

    parent = ParentChunk(
        id="doc-omron-p001",
        document_id="doc-omron-e2e",
        document_title="Omron E2E Proximity Sensor",
        category="Sensor",
        section_title="Operating Ratings",
        text="The Omron E2E proximity sensor has an IP67 rating with a sensing distance of 5mm to 10mm. Operating voltage is 12V to 24V DC with NPN normally open output.",
        token_count=35,
        is_table=False,
        page_number=3,
    )

    child = ChildChunk(
        id="doc-omron-p001-c001",
        parent_id="doc-omron-p001",
        document_id="doc-omron-e2e",
        document_title="Omron E2E Proximity Sensor",
        category="Sensor",
        section_title="Operating Ratings",
        text="[Omron E2E Proximity Sensor > Operating Ratings]\nOmron E2E IP67 proximity sensor with 5mm-10mm sensing distance, 12-24V DC NPN.",
        token_count=22,
        is_table=False,
        page_number=3,
    )

    from app.services.embedding import get_embedding_service
    embedder = get_embedding_service()
    vector = embedder.embed_documents([child.text])[0]

    store.upsert_chunks(parents=[parent], children=[child], embeddings=[vector])
    return store


@pytest.mark.asyncio
async def test_post_chat_sse_stream_in_scope(populated_vector_store, monkeypatch):
    """Verify POST /api/v1/chat yields SSE metadata, token stream, and done events."""
    monkeypatch.setattr("app.services.retrieval_pipeline.get_vector_store", lambda: populated_vector_store)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        req_payload = {
            "query": "What is the sensing distance of the Omron E2E sensor?",
            "conversation_id": "conv_test_123",
        }

        response = await client.post("/api/v1/chat", json=req_payload)
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

        events = []
        for line in response.text.split("\n"):
            line = line.strip()
            if line.startswith("data: "):
                events.append(json.loads(line[len("data: "):]))

        assert len(events) >= 2
        # First event must be metadata
        assert events[0]["type"] == "metadata"
        assert events[0]["passed_guardrail"] is True
        assert len(events[0]["citations"]) >= 1

        # Followed by tokens and final done event
        token_contents = [e["content"] for e in events if e.get("type") == "token"]
        assert len(token_contents) > 0
        assert any(e.get("type") == "done" for e in events)


@pytest.mark.asyncio
async def test_post_chat_sse_stream_guardrail_refusal(populated_vector_store, monkeypatch):
    """Verify POST /api/v1/chat immediately yields refusal stream without invoking LLM."""
    monkeypatch.setattr("app.services.retrieval_pipeline.get_vector_store", lambda: populated_vector_store)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        req_payload = {
            "query": "How to make a chocolate cake?",
        }

        response = await client.post("/api/v1/chat", json=req_payload)
        assert response.status_code == 200

        events = []
        for line in response.text.split("\n"):
            line = line.strip()
            if line.startswith("data: "):
                events.append(json.loads(line[len("data: "):]))

        assert events[0]["type"] == "metadata"
        assert events[0]["passed_guardrail"] is False
        assert events[0]["confidence_score"] < 0.65

        tokens = "".join([e["content"] for e in events if e.get("type") == "token"])
        assert "could not be verified" in tokens.lower() or "out of scope" in tokens.lower()
