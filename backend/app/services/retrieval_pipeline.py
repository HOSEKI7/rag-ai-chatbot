from typing import List, Optional, Tuple, Set
from pydantic import BaseModel
from app.core.config import settings
from app.services.embedding import get_embedding_service
from app.services.vector_store import get_vector_store, RetrievedChunk
from app.services.reranker import get_reranker_service, RerankedChunk


class CitationMetadata(BaseModel):
    index: int
    document_id: str
    document_title: str
    category: str
    section_title: str
    page_number: int
    chunk_id: str
    parent_id: str
    excerpt: str
    confidence_score: float


class PipelineRetrievalResult(BaseModel):
    passed_guardrail: bool
    confidence_score: float
    refusal_message: Optional[str] = None
    chunks: List[RerankedChunk] = []
    reconstructed_context: str = ""
    citations: List[CitationMetadata] = []


def _assemble_deduplicated_context(
    reranked_chunks: List[RerankedChunk],
) -> Tuple[str, List[CitationMetadata]]:
    """
    Deduplicates parent chunk contexts across top-ranked chunks and generates
    sequential, 1-to-1 matching citation headers with excerpt metadata.
    """
    citations: List[CitationMetadata] = []
    context_blocks: List[str] = []
    seen_parents: Set[str] = set()
    citation_idx = 1

    for chunk in reranked_chunks:
        if chunk.parent_id in seen_parents:
            continue

        seen_parents.add(chunk.parent_id)

        # Create concise excerpt for citation card
        clean_text = chunk.text.split("\n", 1)[-1].strip() if "\n" in chunk.text else chunk.text
        excerpt = clean_text[:180] + ("..." if len(clean_text) > 180 else "")

        citations.append(
            CitationMetadata(
                index=citation_idx,
                document_id=chunk.document_id,
                document_title=chunk.document_title,
                category=chunk.category,
                section_title=chunk.section_title,
                page_number=chunk.page_number,
                chunk_id=chunk.id,
                parent_id=chunk.parent_id,
                excerpt=excerpt,
                confidence_score=chunk.confidence_score,
            )
        )

        context_header = (
            f"[Citation {citation_idx}: {chunk.document_title} > "
            f"{chunk.section_title} (Page {chunk.page_number})]"
        )
        content = chunk.parent_text if chunk.parent_text else chunk.text
        context_blocks.append(f"{context_header}\n{content.strip()}")

        citation_idx += 1

    reconstructed_context = "\n\n---\n\n".join(context_blocks)
    return reconstructed_context, citations


def execute_retrieval_pipeline(
    query: str,
    filter_doc_ids: Optional[List[str]] = None,
    confidence_threshold: Optional[float] = None,
    top_k_retrieval: Optional[int] = None,
    top_k_rerank: Optional[int] = None,
) -> PipelineRetrievalResult:
    """
    Executes the full hybrid retrieval and guardrail pipeline:
    1. Embed query with 'search_query: ' prefix
    2. Vector similarity retrieval (Top-20 candidates from Qdrant)
    3. Cross-encoder reranking (FlashRank pruned to Top-5)
    4. Confidence threshold check (>= theta) with deterministic refusal on out-of-scope queries
    5. Deduplicated Parent Chunk context reconstruction and citation tagging
    """
    threshold = confidence_threshold if confidence_threshold is not None else settings.CONFIDENCE_THRESHOLD
    k_retrieve = top_k_retrieval or settings.TOP_K_RETRIEVAL
    k_rerank = top_k_rerank or settings.TOP_K_RERANK

    # 1. Query Embedding
    embedding_service = get_embedding_service()
    query_vector = embedding_service.embed_query(query)

    # 2. Vector Retrieval
    vector_store = get_vector_store()
    candidates: List[RetrievedChunk] = vector_store.retrieve_chunks(
        query_vector=query_vector,
        limit=k_retrieve,
        filter_doc_ids=filter_doc_ids,
    )

    if not candidates:
        return PipelineRetrievalResult(
            passed_guardrail=False,
            confidence_score=0.0,
            refusal_message="The query could not be verified against the indexed industrial datasheets. (No relevant document sections found).",
            chunks=[],
            reconstructed_context="",
            citations=[],
        )

    # 3. FlashRank Cross-Encoder Reranking
    reranker = get_reranker_service()
    reranked_chunks: List[RerankedChunk] = reranker.rerank(
        query=query,
        candidates=candidates,
        top_k=k_rerank,
    )

    top_score = reranked_chunks[0].confidence_score if reranked_chunks else 0.0

    # 4. Confidence Guardrail Check
    if top_score < threshold:
        return PipelineRetrievalResult(
            passed_guardrail=False,
            confidence_score=top_score,
            refusal_message="The query could not be verified against the indexed industrial datasheets. (Confidence score below threshold).",
            chunks=reranked_chunks,
            reconstructed_context="",
            citations=[],
        )

    # 5. Parent Context Reconstruction & Citation Assembling
    reconstructed_context, citations = _assemble_deduplicated_context(reranked_chunks)

    return PipelineRetrievalResult(
        passed_guardrail=True,
        confidence_score=top_score,
        refusal_message=None,
        chunks=reranked_chunks,
        reconstructed_context=reconstructed_context,
        citations=citations,
    )
