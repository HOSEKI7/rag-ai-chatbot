from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.retrieval_pipeline import (
    execute_retrieval_pipeline,
    PipelineRetrievalResult,
    CitationMetadata,
)
from app.services.reranker import RerankedChunk

router = APIRouter()


class RetrieveRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User question or technical query")
    filter_doc_ids: Optional[List[str]] = Field(None, description="Optional list of document IDs to scope search")
    confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Minimum cross-encoder confidence cutoff")
    limit: Optional[int] = Field(5, ge=1, le=20, description="Number of top reranked chunks to return")


class RetrieveResponse(BaseModel):
    query: str
    passed_guardrail: bool
    confidence_score: float
    refusal_message: Optional[str] = None
    chunks: List[RerankedChunk] = []
    reconstructed_context: str = ""
    citations: List[CitationMetadata] = []


@router.post("/retrieve", response_model=RetrieveResponse)
async def retrieve_pipeline(request: RetrieveRequest) -> RetrieveResponse:
    """
    Execute Hybrid Retrieval & Guardrail Engine:
    1. Embed query with 'search_query: ' prefix
    2. Vector similarity retrieval (Top-20 candidates from Qdrant)
    3. FlashRank cross-encoder reranking (pruned to Top-K)
    4. Confidence cutoff evaluation (refusing out-of-scope queries)
    5. Parent chunk context reconstruction and citation tagging
    """
    result: PipelineRetrievalResult = execute_retrieval_pipeline(
        query=request.query,
        filter_doc_ids=request.filter_doc_ids,
        confidence_threshold=request.confidence_threshold,
        top_k_rerank=request.limit,
    )

    return RetrieveResponse(
        query=request.query,
        passed_guardrail=result.passed_guardrail,
        confidence_score=result.confidence_score,
        refusal_message=result.refusal_message,
        chunks=result.chunks,
        reconstructed_context=result.reconstructed_context,
        citations=result.citations,
    )
