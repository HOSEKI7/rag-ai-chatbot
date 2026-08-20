import math
from typing import List, Optional
from pydantic import BaseModel
from flashrank import Ranker, RerankRequest
from app.services.vector_store import RetrievedChunk

DEFAULT_RERANK_MODEL = "ms-marco-TinyBERT-L-2-v2"


def _sigmoid(x: float) -> float:
    """Computes sigmoid to map cross-encoder logits cleanly to [0.0, 1.0]."""
    try:
        return 1.0 / (1.0 + math.exp(-x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0


class RerankedChunk(RetrievedChunk):
    """
    Candidate chunk with cross-encoder confidence score evaluation.
    Inherits all structured metadata from RetrievedChunk to prevent data clumps.
    """
    similarity_score: float = 0.0
    confidence_score: float = 0.0

    @classmethod
    def from_retrieved(cls, chunk: RetrievedChunk, confidence_score: float) -> "RerankedChunk":
        return cls(
            **chunk.model_dump(),
            similarity_score=chunk.score,
            confidence_score=round(confidence_score, 4),
        )


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

        # Prepare candidate chunk inputs for FlashRank
        candidate_items = [
            {
                "id": c.id,
                "text": c.text,
                "meta": c,
            }
            for c in candidates
        ]

        rerank_request = RerankRequest(query=query, passages=candidate_items)
        ranked_results = self._ranker.rerank(rerank_request)

        reranked_chunks: List[RerankedChunk] = []
        for res in ranked_results[:top_k]:
            original_chunk: RetrievedChunk = res["meta"]
            raw_score = float(res.get("score", 0.0))
            
            # If raw score is in [0.0, 1.0], use directly; otherwise apply sigmoid normalization
            if 0.0 <= raw_score <= 1.0:
                normalized_score = raw_score
            else:
                normalized_score = _sigmoid(raw_score)

            reranked_chunks.append(
                RerankedChunk.from_retrieved(
                    chunk=original_chunk,
                    confidence_score=normalized_score,
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
