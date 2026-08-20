import threading
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class QueryTrace(BaseModel):
    id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    query: str
    latency_ms: float
    retrieval_latency_ms: float = 0.0
    generation_latency_ms: float = 0.0
    confidence_score: float
    passed_guardrail: bool
    provider: str
    retrieved_documents: List[str] = Field(default_factory=list)
    refusal_reason: Optional[str] = None


class AggregatedMetrics(BaseModel):
    total_queries: int
    successful_queries: int
    rejected_queries_count: int
    guardrail_pass_rate: float
    average_confidence_score: float
    average_latency_ms: float
    average_retrieval_latency_ms: float
    average_generation_latency_ms: float
    provider_distribution: Dict[str, int]
    top_retrieved_documents: List[Dict[str, Any]]
    recent_traces: List[QueryTrace]
    rejected_queries: List[QueryTrace]


class AnalyticsService:
    def __init__(self, max_traces: int = 500):
        self._max_traces = max_traces
        self._traces: List[QueryTrace] = []
        self._lock = threading.Lock()

    def record_trace(self, trace: QueryTrace) -> None:
        with self._lock:
            if not trace.id:
                trace.id = f"trace_{int(time.time() * 1000)}_{len(self._traces) + 1}"
            self._traces.append(trace)
            if len(self._traces) > self._max_traces:
                self._traces.pop(0)

    def get_traces(self, limit: int = 50) -> List[QueryTrace]:
        with self._lock:
            return list(reversed(self._traces[-limit:]))

    def clear_traces(self) -> None:
        with self._lock:
            self._traces.clear()

    def get_aggregated_metrics(self) -> AggregatedMetrics:
        with self._lock:
            traces = list(self._traces)

        total = len(traces)
        if total == 0:
            return AggregatedMetrics(
                total_queries=0,
                successful_queries=0,
                rejected_queries_count=0,
                guardrail_pass_rate=100.0,
                average_confidence_score=0.0,
                average_latency_ms=0.0,
                average_retrieval_latency_ms=0.0,
                average_generation_latency_ms=0.0,
                provider_distribution={},
                top_retrieved_documents=[],
                recent_traces=[],
                rejected_queries=[],
            )

        successful = [t for t in traces if t.passed_guardrail]
        rejected = [t for t in traces if not t.passed_guardrail]

        avg_conf = sum(t.confidence_score for t in traces) / total
        avg_latency = sum(t.latency_ms for t in traces) / total
        avg_retrieval = sum(t.retrieval_latency_ms for t in traces) / total
        avg_generation = sum(t.generation_latency_ms for t in traces) / total

        providers: Dict[str, int] = {}
        for t in traces:
            prov = t.provider or "unknown"
            providers[prov] = providers.get(prov, 0) + 1

        doc_counts: Dict[str, int] = {}
        for t in traces:
            for doc in t.retrieved_documents:
                doc_counts[doc] = doc_counts.get(doc, 0) + 1

        sorted_docs = sorted(
            [{"document_id": doc_id, "count": count} for doc_id, count in doc_counts.items()],
            key=lambda x: x["count"],
            reverse=True,
        )[:10]

        return AggregatedMetrics(
            total_queries=total,
            successful_queries=len(successful),
            rejected_queries_count=len(rejected),
            guardrail_pass_rate=round((len(successful) / total) * 100.0, 1),
            average_confidence_score=round(avg_conf, 3),
            average_latency_ms=round(avg_latency, 1),
            average_retrieval_latency_ms=round(avg_retrieval, 1),
            average_generation_latency_ms=round(avg_generation, 1),
            provider_distribution=providers,
            top_retrieved_documents=sorted_docs,
            recent_traces=list(reversed(traces[-50:])),
            rejected_queries=list(reversed(rejected[-50:])),
        )


_global_analytics_service: Optional[AnalyticsService] = None


def get_analytics_service() -> AnalyticsService:
    global _global_analytics_service
    if _global_analytics_service is None:
        _global_analytics_service = AnalyticsService()
    return _global_analytics_service
