import pytest
from app.services.chunker import ParentChunk, ChildChunk
from app.services.vector_store import VectorStoreService
from app.services.retrieval_pipeline import execute_retrieval_pipeline, PipelineRetrievalResult


@pytest.fixture
def populated_vector_store():
    store = VectorStoreService(location=":memory:", collection_name="test_pipeline_store")
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


def test_retrieval_pipeline_passes_guardrail_for_in_scope_query(populated_vector_store, monkeypatch):
    """Verify in-scope technical query passes confidence threshold and reconstructs parent context."""
    monkeypatch.setattr("app.services.retrieval_pipeline.get_vector_store", lambda: populated_vector_store)

    query = "What is the sensing distance and operating voltage for the Omron E2E sensor?"

    result = execute_retrieval_pipeline(query=query, confidence_threshold=0.60)

    assert isinstance(result, PipelineRetrievalResult)
    assert result.passed_guardrail is True
    assert result.confidence_score >= 0.60
    assert result.refusal_message is None
    assert len(result.chunks) >= 1
    assert "Omron E2E Proximity Sensor" in result.reconstructed_context
    assert "12V to 24V DC" in result.reconstructed_context
    assert len(result.citations) >= 1
    assert result.citations[0].document_title == "Omron E2E Proximity Sensor"
    assert result.citations[0].page_number == 3


def test_retrieval_pipeline_refuses_out_of_scope_query(populated_vector_store, monkeypatch):
    """Verify irrelevant query triggers deterministic guardrail refusal without invoking LLM."""
    monkeypatch.setattr("app.services.retrieval_pipeline.get_vector_store", lambda: populated_vector_store)

    irrelevant_query = "What is the recipe for chocolate chip cookies with sea salt?"

    result = execute_retrieval_pipeline(query=irrelevant_query, confidence_threshold=0.65)

    assert isinstance(result, PipelineRetrievalResult)
    assert result.passed_guardrail is False
    assert result.confidence_score < 0.65
    assert result.refusal_message is not None
    assert "could not be verified" in result.refusal_message.lower() or "out of scope" in result.refusal_message.lower()
    assert result.reconstructed_context == ""
