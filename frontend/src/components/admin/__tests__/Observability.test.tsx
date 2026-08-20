import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ObservabilityDashboardPage from "@/app/admin/observability/page";
import * as analyticsApi from "@/lib/api/analytics";

describe("Observability & RAG Analytics Dashboard UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the observability dashboard headers and KPI metrics", async () => {
    vi.spyOn(analyticsApi, "fetchAnalyticsMetrics").mockResolvedValueOnce({
      total_queries: 42,
      successful_queries: 38,
      rejected_queries_count: 4,
      guardrail_pass_rate: 90.5,
      average_confidence_score: 0.84,
      average_latency_ms: 385.2,
      average_retrieval_latency_ms: 110.4,
      average_generation_latency_ms: 274.8,
      provider_distribution: { gemini: 30, groq: 8, guardrail_refusal: 4 },
      provider_metrics: {
        gemini: { invocation_count: 30, average_latency_ms: 360.0 },
        groq: { invocation_count: 8, average_latency_ms: 420.0 },
      },
      confidence_distribution: [
        {
          label: "< 0.65 (Refusal)",
          range_min: 0.0,
          range_max: 0.65,
          count: 4,
        },
        {
          label: "0.65 - 0.75 (Moderate)",
          range_min: 0.65,
          range_max: 0.75,
          count: 6,
        },
        {
          label: "0.75 - 0.85 (High)",
          range_min: 0.75,
          range_max: 0.85,
          count: 12,
        },
        {
          label: "> 0.85 (Very High)",
          range_min: 0.85,
          range_max: 1.0,
          count: 20,
        },
      ],
      top_retrieved_documents: [{ document_id: "doc_siemens_1le1", count: 18 }],
      recent_traces: [
        {
          id: "t-1",
          timestamp: "2026-08-20T22:00:00Z",
          query: "What is Siemens 1LE1 rated torque?",
          latency_ms: 320.0,
          retrieval_latency_ms: 95.0,
          generation_latency_ms: 225.0,
          confidence_score: 0.92,
          passed_guardrail: true,
          provider: "gemini",
          retrieved_documents: ["doc_siemens_1le1"],
        },
      ],
      rejected_queries: [
        {
          id: "t-2",
          timestamp: "2026-08-20T22:05:00Z",
          query: "How to bake a chocolate cake?",
          latency_ms: 85.0,
          retrieval_latency_ms: 85.0,
          generation_latency_ms: 0.0,
          confidence_score: 0.18,
          passed_guardrail: false,
          provider: "guardrail_refusal",
          retrieved_documents: [],
          refusal_reason: "Out-of-scope query",
        },
      ],
    });

    render(<ObservabilityDashboardPage />);
    expect(screen.getByText(/RAG Telemetry & Analytics/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("42")).toBeDefined();
      expect(screen.getByText("90.5%")).toBeDefined();
      expect(screen.getByText("84.0%")).toBeDefined();
      expect(
        screen.getByText(/Confidence Score Distribution Histogram/i)
      ).toBeDefined();
      expect(
        screen.getByText(/Most-Retrieved Source Datasheets/i)
      ).toBeDefined();
      expect(
        screen.getByText(/What is Siemens 1LE1 rated torque/i)
      ).toBeDefined();
      expect(screen.getByText(/How to bake a chocolate cake/i)).toBeDefined();
    });
  });
});
