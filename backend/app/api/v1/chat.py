import json
import time
from typing import List, Optional, AsyncGenerator, Dict, Any
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.services.retrieval_pipeline import (
    execute_retrieval_pipeline,
    PipelineRetrievalResult,
    CitationMetadata,
)
from app.services.prompt_builder import build_rag_prompt
from app.services.llm_provider import get_llm_provider, StreamToken

router = APIRouter()


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message text content")


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User question or technical query")
    conversation_id: Optional[str] = Field(None, description="Optional conversation tracking ID")
    filter_doc_ids: Optional[List[str]] = Field(None, description="Optional list of document IDs to scope retrieval")
    history: Optional[List[ChatMessage]] = Field(None, description="Recent conversation turns for multi-turn context")
    confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Minimum confidence score cutoff")


async def chat_sse_generator(request: ChatRequest) -> AsyncGenerator[str, None]:
    """
    Asynchronous Server-Sent Events (SSE) streaming generator:
    1. Executes hybrid retrieval and confidence guardrail.
    2. Emits metadata SSE payload with citations and confidence score.
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
        yield f"data: {json.dumps({'type': 'token', 'content': refusal_text})}\n\n"
        
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        done_event = {
            "type": "done",
            "provider": "guardrail_refusal",
            "latency_ms": elapsed_ms,
        }
        yield f"data: {json.dumps(done_event)}\n\n"
        return

    # 4. Grounded Prompt Building
    history_dicts = [h.model_dump() for h in request.history] if request.history else None
    system_prompt, user_prompt = build_rag_prompt(
        query=request.query,
        reconstructed_context=retrieval_res.reconstructed_context,
        history=history_dicts,
    )

    # 5. Stream LLM Tokens with Automatic Fallback
    llm_provider = get_llm_provider()
    active_provider = "unknown"

    try:
        async for stream_token in llm_provider.stream_generation(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        ):
            active_provider = stream_token.provider
            token_event = {
                "type": "token",
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

    # 6. Emit Done Event
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    done_event = {
        "type": "done",
        "provider": active_provider,
        "latency_ms": elapsed_ms,
    }
    yield f"data: {json.dumps(done_event)}\n\n"


@router.post("/chat")
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


@router.post("/query")
async def query_endpoint_alias(request: ChatRequest) -> StreamingResponse:
    """Spec-compliant alias for /chat endpoint."""
    return await chat_endpoint(request)
