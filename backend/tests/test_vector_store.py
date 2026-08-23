import pytest
from app.services.vector_store import VectorStoreService, RetrievedChunk
from app.services.chunker import ParentChunk, ChildChunk


@pytest.fixture
def in_memory_vector_store():
    # Use in-memory Qdrant instance for fast, self-contained unit/integration testing
    store = VectorStoreService(location=":memory:", collection_name="test_collection")
    store.ensure_collection(vector_size=384)
    return store


def test_upsert_and_retrieve_chunks(in_memory_vector_store: VectorStoreService):
    """Verify storing chunks and retrieving by similarity search."""
    store = in_memory_vector_store

    parent = ParentChunk(
        id="doc-001-p001",
        document_id="doc-001",
        document_title="Siemens Motor Manual",
        category="Motor",
        section_title="Specifications",
        text="Full parent context: Siemens 1LE1 motor 15 kW 1475 RPM 97 Nm torque.",
        token_count=15,
        is_table=False,
    )

    child = ChildChunk(
        id="doc-001-p001-c001",
        parent_id="doc-001-p001",
        document_id="doc-001",
        document_title="Siemens Motor Manual",
        category="Motor",
        section_title="Specifications",
        text="[Siemens Motor Manual > Specifications]\nSiemens 1LE1 15 kW motor with 97 Nm torque.",
        token_count=18,
        is_table=False,
    )

    dummy_vector = [0.1] * 384

    store.upsert_chunks(
        parents=[parent],
        children=[child],
        embeddings=[dummy_vector],
    )

    # Search with retrieve_chunks
    results = store.retrieve_chunks(query_vector=dummy_vector, limit=5)

    assert len(results) == 1
    hit = results[0]
    assert isinstance(hit, RetrievedChunk)
    assert hit.id == child.id
    assert hit.document_id == "doc-001"
    assert hit.category == "Motor"
    assert hit.parent_id == parent.id
    assert hit.document_title == "Siemens Motor Manual"
    assert hit.parent_text == parent.text
    assert hit.score > 0.99


def test_list_and_delete_documents(in_memory_vector_store: VectorStoreService):
    """Verify document listing and deletion."""
    store = in_memory_vector_store

    parent = ParentChunk(
        id="doc-002-p001",
        document_id="doc-002",
        document_title="Omron Sensor Datasheet",
        category="Sensor",
        section_title="General",
        text="Parent text for Omron sensor.",
        token_count=10,
        is_table=False,
    )

    child = ChildChunk(
        id="doc-002-p001-c001",
        parent_id="doc-002-p001",
        document_id="doc-002",
        document_title="Omron Sensor Datasheet",
        category="Sensor",
        section_title="General",
        text="Child chunk for Omron sensor.",
        token_count=8,
        is_table=False,
    )

    store.upsert_chunks(
        parents=[parent],
        children=[child],
        embeddings=[[0.05] * 384],
    )

    docs = store.list_indexed_documents()
    assert len(docs) == 1
    assert docs[0].document_id == "doc-002"
    assert docs[0].category == "Sensor"
    assert docs[0].chunk_count == 1

    # Delete document
    store.delete_document("doc-002")
    docs_after = store.list_indexed_documents()
    assert len(docs_after) == 0
