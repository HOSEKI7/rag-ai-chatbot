"use client";

import { AggregatedAnalytics } from "@/lib/api/analytics";

interface MetricsKpiGridProps {
  metrics: AggregatedAnalytics;
}

export function MetricsKpiGrid({ metrics }: MetricsKpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Total Queries */}
      <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-5 space-y-1">
        <span className="text-[10px] font-mono text-[var(--color-sage-leaf)] uppercase block">
          QUERY VOLUME
        </span>
        <div className="text-3xl font-medium text-[var(--color-olive-press)]">
          {metrics.total_queries}
        </div>
        <div className="text-xs font-mono text-[var(--color-sage-gray)] flex items-center justify-between pt-1">
          <span>Success: {metrics.successful_queries}</span>
          <span>·</span>
          <span>Rejected: {metrics.rejected_queries_count}</span>
        </div>
      </div>

      {/* 2. Guardrail Pass Rate */}
      <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-5 space-y-1">
        <span className="text-[10px] font-mono text-[var(--color-sage-leaf)] uppercase block">
          GUARDRAIL PASS RATE
        </span>
        <div className="text-3xl font-medium text-[var(--color-forest-ink)]">
          {metrics.guardrail_pass_rate}%
        </div>
        <div className="text-xs font-mono text-[var(--color-sage-gray)] pt-1">
          Threshold: &theta; &ge; 0.65 score
        </div>
      </div>

      {/* 3. Average Confidence Score */}
      <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-5 space-y-1">
        <span className="text-[10px] font-mono text-[var(--color-sage-leaf)] uppercase block">
          AVG CONFIDENCE SCORE
        </span>
        <div className="text-3xl font-medium text-[var(--color-olive-press)]">
          {(metrics.average_confidence_score * 100).toFixed(1)}%
        </div>
        <div className="text-xs font-mono text-[var(--color-sage-gray)] pt-1">
          Cross-Encoder Calibrated
        </div>
      </div>

      {/* 4. Average Latency Breakdown */}
      <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-5 space-y-1">
        <span className="text-[10px] font-mono text-[var(--color-sage-leaf)] uppercase block">
          AVG TOTAL LATENCY
        </span>
        <div className="text-3xl font-medium text-[var(--color-forest-ink)]">
          {metrics.average_latency_ms}{" "}
          <span className="text-sm font-normal">ms</span>
        </div>
        <div className="text-xs font-mono text-[var(--color-sage-gray)] flex items-center justify-between pt-1">
          <span>R: {metrics.average_retrieval_latency_ms}ms</span>
          <span>·</span>
          <span>G: {metrics.average_generation_latency_ms}ms</span>
        </div>
      </div>
    </div>
  );
}
