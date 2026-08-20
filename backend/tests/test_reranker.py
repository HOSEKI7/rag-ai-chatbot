import pytest
from app.services.vector_store import RetrievedChunk
from app.services.reranker import get_reranker_service, RerankedChunk


def test_reranker_ranks_relevant_chunk_higher():
    """Verify FlashRank cross-encoder boosts the most semantically relevant technical chunk."""
    reranker = get_reranker_service()

    query = "What is the rated power and torque of the 1LE1 motor?"

    chunk_relevant = RetrievedChunk(
        id="chunk-motor-specs",
        document_id="doc-siemens-1le1",
        document_title="Siemens 1LE1 Motor Datasheet",
        category="Motor",
        section_title="Technical Specifications",
        parent_id="p-001",
        text="The Siemens 1LE1 AC induction motor delivers 15 kW rated output power with 97 Nm rated torque at 1475 RPM.",
        parent_text="Full parent section with 15 kW output and 97 Nm torque specifications.",
        token_count=25,
        is_table=False,
        page_number=2,
        score=0.70,  # Vector score
    )

    chunk_irrelevant = RetrievedChunk(
        id="chunk-cable-entry",
        document_id="doc-siemens-1le1",
        document_title="Siemens 1LE1 Motor Datasheet",
        category="Motor",
        section_title="Terminal Box & Cable Entry",
        parent_id="p-002",
        text="The terminal box is located on the top with two M25 threaded cable entry glands.",
        parent_text="Terminal box mounting options and gland sizes.",
        token_count=20,
        is_table=False,
        page_number=5,
        score=0.72,  # Artificially higher initial vector score
    )

    reranked = reranker.rerank(
        query=query,
        candidates=[chunk_irrelevant, chunk_relevant],
        top_k=2,
    )

    assert len(reranked) == 2
    assert all(isinstance(c, RerankedChunk) for c in reranked)
    # The relevant specifications chunk must be reranked to rank #1
    assert reranked[0].id == "chunk-motor-specs"
    assert reranked[0].rerank_score > reranked[1].rerank_score
    assert 0.0 <= reranked[0].rerank_score <= 1.0
