import os
import json
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


class ConfidenceBucket(BaseModel):
    label: str
    range_min: float
    range_max: float
    count: int


class ProviderMetrics(BaseModel):
    invocation_count: int
    average_latency_ms: float


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
    provider_metrics: Dict[str, ProviderMetrics] = Field(default_factory=dict)
    confidence_distribution: List[ConfidenceBucket] = Field(default_factory=list)
    top_retrieved_documents: List[Dict[str, Any]]
    recent_traces: List[QueryTrace]
    rejected_queries: List[QueryTrace]


class AnalyticsService:
    def __init__(self, storage_path: Optional[str] = None, max_traces: int = 500):
        self._storage_path = storage_path or os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "analytics_traces.json"
        )
        self._max_traces = max_traces
        self._traces: List[QueryTrace] = []
        self._lock = threading.Lock()
        self._load_persisted_traces()

    def _load_persisted_traces(self) -> None:
        if os.path.exists(self._storage_path):
            try:
                with open(self._storage_path, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    self._traces = [QueryTrace(**item) for item in raw_data][-self._max_traces:]
            except Exception:
                self._traces = []

    def _save_traces(self) -> None:
        try:
            os.makedirs(os.path.dirname(self._storage_path), exist_ok=True)
            with open(self._storage_path, "w", encoding="utf-8") as f:
                json.dump([t.model_dump() for t in self._traces], f, indent=2)
        except Exception:
            pass

    def record_trace(self, trace: QueryTrace) -> None:
        with self._lock:
            if not trace.id:
                trace.id = f"trace_{int(time.time() * 1000)}_{len(self._traces) + 1}"
            self._traces.append(trace)
            if len(self._traces) > self._max_traces:
                self._traces.pop(0)
            self._save_traces()

    def get_traces(self, limit: int = 50) -> List[QueryTrace]:
        with self._lock:
            return list(reversed(self._traces[-limit:]))

    def clear_traces(self) -> None:
        with self._lock:
            self._traces.clear()
            self._save_traces()

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
                provider_metrics={},
                confidence_distribution=[
                    ConfidenceBucket(label="< 0.65 (Refusal)", range_min=0.0, range_max=0.65, count=0),
                    ConfidenceBucket(label="0.65 - 0.75 (Moderate)", range_min=0.65, range_max=0.75, count=0),
                    ConfidenceBucket(label="0.75 - 0.85 (High)", range_min=0.75, range_max=0.85, count=0),
                    ConfidenceBucket(label="> 0.85 (Very High)", range_min=0.85, range_max=1.0, count=0),
                ],
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

        # Provider Breakdown with Avg Latency
        providers: Dict[str, int] = {}
        provider_latencies: Dict[str, List[float]] = {}
        for t in traces:
            prov = t.provider or "unknown"
            providers[prov] = providers.get(prov, 0) + 1
            if prov not in provider_latencies:
                provider_latencies[prov] = []
            provider_latencies[prov].append(t.latency_ms)

        provider_metrics: Dict[str, ProviderMetrics] = {
            prov: ProviderMetrics(
                invocation_count=count,
                average_latency_ms=round(sum(provider_latencies[prov]) / len(provider_latencies[prov]), 1),
            )
            for prov, count in providers.items()
        }

        # Confidence Distribution Histogram Buckets
        b1 = sum(1 for t in traces if t.confidence_score < 0.65)
        b2 = sum(1 for t in traces if 0.65 <= t.confidence_score < 0.75)
        b3 = sum(1 for t in traces if 0.75 <= t.confidence_score < 0.85)
        b4 = sum(1 for t in traces if t.confidence_score >= 0.85)

        confidence_distribution = [
            ConfidenceBucket(label="< 0.65 (Refusal)", range_min=0.0, range_max=0.65, count=b1),
            ConfidenceBucket(label="0.65 - 0.75 (Moderate)", range_min=0.65, range_max=0.75, count=b2),
            ConfidenceBucket(label="0.75 - 0.85 (High)", range_min=0.75, range_max=0.85, count=b3),
            ConfidenceBucket(label="> 0.85 (Very High)", range_min=0.85, range_max=1.0, count=b4),
        ]

        # Top Retrieved Documents
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
            provider_metrics=provider_metrics,
            confidence_distribution=confidence_distribution,
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
