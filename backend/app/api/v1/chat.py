import json
import time
from typing import List, Optional, AsyncGenerator
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.services.retrieval_pipeline import (
    execute_retrieval_pipeline,
    PipelineRetrievalResult,
    CitationMetadata,
)
from app.services.prompt_builder import build_rag_prompt, ChatMessage
from app.services.llm_provider import get_llm_provider, StreamToken
from app.services.analytics import get_analytics_service, QueryTrace

router = APIRouter()



class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User question or technical query")
    conversation_id: Optional[str] = Field(None, description="Optional conversation tracking ID")
    filter_doc_ids: Optional[List[str]] = Field(None, description="Optional list of document IDs to scope retrieval")
    history: Optional[List[ChatMessage]] = Field(None, description="Recent conversation turns for multi-turn context")
    confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Minimum confidence score cutoff")


def _record_telemetry(
    query: str,
    latency_ms: float,
    retrieval_latency_ms: float,
    generation_latency_ms: float,
    confidence_score: float,
    passed_guardrail: bool,
    provider: str,
    citations: list,
    refusal_reason: Optional[str] = None,
) -> None:
    try:
        get_analytics_service().record_trace(
            QueryTrace(
                query=query,
                latency_ms=latency_ms,
                retrieval_latency_ms=retrieval_latency_ms,
                generation_latency_ms=generation_latency_ms,
                confidence_score=confidence_score,
                passed_guardrail=passed_guardrail,
                provider=provider,
                retrieved_documents=[c.document_id for c in citations],
                refusal_reason=refusal_reason,
            )
        )
    except Exception:
        pass


async def chat_sse_generator(request: ChatRequest) -> AsyncGenerator[str, None]:
    """
    Asynchronous Server-Sent Events (SSE) streaming generator:
    1. Executes hybrid retrieval and confidence guardrail.
    2. Emits metadata SSE payload with citations, excerpt, and confidence score.
    3. If guardrail fails, streams deterministic refusal response.
    4. If guardrail passes, streams grounded LLM tokens with automatic provider fallback.
    5. Emits completion event with execution metrics.
    """
    start_time = time.perf_counter()

    # 1. Retrieval & Guardrail Pipeline
    retrieval_res: PipelineRetrievalResult = execute_retrieval_pipeline(
        query=request.query,
        filter_doc_ids=request.filter_doc_ids,
        confidence_threshold=request.confidence_threshold,
    )

    # 2. Emit Metadata Event
    metadata_event = {
        "type": "metadata",
        "passed_guardrail": retrieval_res.passed_guardrail,
        "confidence_score": retrieval_res.confidence_score,
        "citations": [c.model_dump() for c in retrieval_res.citations],
        "refusal_message": retrieval_res.refusal_message,
        "conversation_id": request.conversation_id,
    }
    yield f"data: {json.dumps(metadata_event)}\n\n"

    # 3. Guardrail Refusal Stream
    if not retrieval_res.passed_guardrail:
        refusal_text = (
            retrieval_res.refusal_message
            or "The query could not be verified against the indexed industrial datasheets."
        )
        refusal_token_event = {
            "type": "token",
            "token": refusal_text,
            "content": refusal_text,
            "provider": "guardrail_refusal",
        }
        yield f"data: {json.dumps(refusal_token_event)}\n\n"
        
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        done_event = {
            "type": "done",
            "provider": "guardrail_refusal",
            "latency_ms": elapsed_ms,
        }
        yield f"data: {json.dumps(done_event)}\n\n"

        _record_telemetry(
            query=request.query,
            latency_ms=elapsed_ms,
            retrieval_latency_ms=elapsed_ms,
            generation_latency_ms=0.0,
            confidence_score=retrieval_res.confidence_score,
            passed_guardrail=False,
            provider="guardrail_refusal",
            citations=retrieval_res.citations,
            refusal_reason=retrieval_res.refusal_message,
        )
        return

    # 4. Grounded Prompt Building
    retrieval_elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    system_prompt, user_prompt = build_rag_prompt(
        query=request.query,
        reconstructed_context=retrieval_res.reconstructed_context,
        history=request.history,
    )

    # 5. Stream LLM Tokens with Automatic Fallback
    llm_provider = get_llm_provider()
    active_provider = "unknown"
    gen_start = time.perf_counter()

    try:
        async for stream_token in llm_provider.stream_generation(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        ):
            active_provider = stream_token.provider
            token_event = {
                "type": "token",
                "token": stream_token.token,
                "content": stream_token.token,
                "provider": stream_token.provider,
            }
            yield f"data: {json.dumps(token_event)}\n\n"

    except Exception as e:
        error_event = {
            "type": "error",
            "message": f"Generation error: {str(e)}",
        }
        yield f"data: {json.dumps(error_event)}\n\n"

    # 6. Emit Done Event & Record Telemetry
    gen_elapsed_ms = round((time.perf_counter() - gen_start) * 1000, 2)
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    done_event = {
        "type": "done",
        "provider": active_provider,
        "latency_ms": elapsed_ms,
    }
    yield f"data: {json.dumps(done_event)}\n\n"

    _record_telemetry(
        query=request.query,
        latency_ms=elapsed_ms,
        retrieval_latency_ms=retrieval_elapsed_ms,
        generation_latency_ms=gen_elapsed_ms,
        confidence_score=retrieval_res.confidence_score,
        passed_guardrail=True,
        provider=active_provider,
        citations=retrieval_res.citations,
        refusal_reason=None,
    )



@router.post("/chat")
@router.post("/query")
async def chat_endpoint(request: ChatRequest) -> StreamingResponse:
    """
    Streaming chat endpoint emitting Server-Sent Events (SSE) with grounded citations.
    """
    return StreamingResponse(
        chat_sse_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
