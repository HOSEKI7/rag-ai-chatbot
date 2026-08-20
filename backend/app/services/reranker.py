from typing import List, Optional
from pydantic import BaseModel
from flashrank import Ranker, RerankRequest
from app.services.vector_store import RetrievedChunk

DEFAULT_RERANK_MODEL = "ms-marco-TinyBERT-L-2-v2"


class RerankedChunk(BaseModel):
    id: str
    document_id: str
    document_title: str
    category: str
    section_title: str
    parent_id: str
    text: str
    parent_text: str
    token_count: int
    is_table: bool
    page_number: int = 1
    vector_score: float
    rerank_score: float


class RerankerService:
    """
    Local cross-encoder reranking service using FlashRank ONNX models on CPU.
    Reranks top-N retrieved candidate chunks to surface the highest-precision top-K chunks.
    """

    def __init__(self, model_name: str = DEFAULT_RERANK_MODEL):
        self.model_name = model_name
        self._ranker = Ranker(model_name=self.model_name)

    def rerank(
        self,
        query: str,
        candidates: List[RetrievedChunk],
        top_k: int = 5,
    ) -> List[RerankedChunk]:
        """
        Reranks a list of candidate RetrievedChunks against user query using cross-encoder scoring.
        """
        if not candidates:
            return []

        # Construct passages for FlashRank
        passages = [
            {
                "id": c.id,
                "text": c.text,
                "meta": c,
            }
            for c in candidates
        ]

        rerank_request = RerankRequest(query=query, passages=passages)
        ranked_results = self._ranker.rerank(rerank_request)

        reranked_chunks: List[RerankedChunk] = []
        for res in ranked_results[:top_k]:
            original_chunk: RetrievedChunk = res["meta"]
            raw_score = float(res.get("score", 0.0))
            # Bound score to [0.0, 1.0] range
            normalized_score = max(0.0, min(1.0, raw_score))

            reranked_chunks.append(
                RerankedChunk(
                    id=original_chunk.id,
                    document_id=original_chunk.document_id,
                    document_title=original_chunk.document_title,
                    category=original_chunk.category,
                    section_title=original_chunk.section_title,
                    parent_id=original_chunk.parent_id,
                    text=original_chunk.text,
                    parent_text=original_chunk.parent_text,
                    token_count=original_chunk.token_count,
                    is_table=original_chunk.is_table,
                    page_number=original_chunk.page_number,
                    vector_score=original_chunk.score,
                    rerank_score=round(normalized_score, 4),
                )
            )

        return reranked_chunks


_reranker_service_instance: Optional[RerankerService] = None


def get_reranker_service() -> RerankerService:
    """Returns cached singleton instance of RerankerService."""
    global _reranker_service_instance
    if _reranker_service_instance is None:
        _reranker_service_instance = RerankerService()
    return _reranker_service_instance
