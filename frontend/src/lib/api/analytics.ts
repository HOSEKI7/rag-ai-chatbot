import { getBackendBaseUrl } from "@/lib/api/documents";

export interface QueryTraceItem {
  id?: string;
  timestamp: string;
  query: string;
  latency_ms: number;
  retrieval_latency_ms: number;
  generation_latency_ms: number;
  confidence_score: number;
  passed_guardrail: boolean;
  provider: string;
  retrieved_documents: string[];
  refusal_reason?: string | null;
}

export interface AggregatedAnalytics {
  total_queries: number;
  successful_queries: number;
  rejected_queries_count: number;
  guardrail_pass_rate: number;
  average_confidence_score: number;
  average_latency_ms: number;
  average_retrieval_latency_ms: number;
  average_generation_latency_ms: number;
  provider_distribution: Record<string, number>;
  top_retrieved_documents: Array<{ document_id: string; count: number }>;
  recent_traces: QueryTraceItem[];
  rejected_queries: QueryTraceItem[];
}

export async function fetchAnalyticsMetrics(
  baseUrl: string = getBackendBaseUrl()
): Promise<AggregatedAnalytics> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/analytics`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch analytics metrics`);
  }

  return (await res.json()) as AggregatedAnalytics;
}
