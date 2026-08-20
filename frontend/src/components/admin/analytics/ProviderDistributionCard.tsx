"use client";

import { ProviderMetricItem } from "@/lib/api/analytics";

interface ProviderDistributionCardProps {
  distribution: Record<string, number>;
  providerMetrics?: Record<string, ProviderMetricItem>;
  totalQueries: number;
}

export function ProviderDistributionCard({
  distribution,
  providerMetrics = {},
  totalQueries,
}: ProviderDistributionCardProps) {
  const geminiCount =
    distribution["gemini"] || distribution["gemini-2.5-flash"] || 0;
  const groqCount =
    distribution["groq"] || distribution["llama-3.3-70b-versatile"] || 0;
  const refusalCount =
    distribution["guardrail_refusal"] || distribution["refusal"] || 0;

  const totalGenQueries = geminiCount + groqCount;
  const geminiPct =
    totalGenQueries > 0 ? Math.round((geminiCount / totalGenQueries) * 100) : 0;
  const groqPct =
    totalGenQueries > 0 ? Math.round((groqCount / totalGenQueries) * 100) : 0;

  const geminiLatency =
    providerMetrics["gemini"]?.average_latency_ms ||
    providerMetrics["gemini-2.5-flash"]?.average_latency_ms ||
    0;
  const groqLatency =
    providerMetrics["groq"]?.average_latency_ms ||
    providerMetrics["llama-3.3-70b-versatile"]?.average_latency_ms ||
    0;

  return (
    <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 space-y-4">
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-1">
          PROVIDER TELEMETRY
        </span>
        <h3 className="text-lg font-medium text-[var(--color-olive-press)]">
          LLM Primary vs. Fallback Invocation & Latency
        </h3>
        <p className="text-xs text-[var(--color-sage-gray)] mt-1 font-sans">
          Invocation distribution and average end-to-end response time between
          primary Gemini 2.5 Flash and automatic Groq fallback.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-full overflow-hidden flex">
        <div
          style={{ width: `${geminiPct}%` }}
          className="bg-[var(--color-forest-ink)] h-full transition-all"
          title={`Gemini: ${geminiCount} (${geminiPct}%)`}
        />
        <div
          style={{ width: `${groqPct}%` }}
          className="bg-[var(--color-sage-leaf)] h-full transition-all"
          title={`Groq Fallback: ${groqCount} (${groqPct}%)`}
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
        <div className="p-3 rounded-[var(--radius-inputs)] bg-[var(--surface-linen)] border border-[var(--color-mist)] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--color-forest-ink)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-forest-ink)]" />
            <span>Gemini 2.5 Flash (Primary)</span>
          </div>
          <div className="text-sm font-bold text-[var(--color-forest-ink)]">
            {geminiCount} queries ({geminiPct}%)
          </div>
          <span className="text-[10px] text-[var(--color-sage-gray)] block">
            Avg Latency: {geminiLatency > 0 ? `${geminiLatency}ms` : "Active"}
          </span>
        </div>

        <div className="p-3 rounded-[var(--radius-inputs)] bg-[var(--surface-linen)] border border-[var(--color-mist)] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--color-olive-press)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-sage-leaf)]" />
            <span>Groq Llama 3.3 (Fallback)</span>
          </div>
          <div className="text-sm font-bold text-[var(--color-olive-press)]">
            {groqCount} queries ({groqPct}%)
          </div>
          <span className="text-[10px] text-[var(--color-sage-gray)] block">
            Avg Latency: {groqLatency > 0 ? `${groqLatency}ms` : "Standby"}
          </span>
        </div>

        <div className="p-3 rounded-[var(--radius-inputs)] bg-[var(--surface-linen)] border border-[var(--color-mist)] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--color-crimson-specimen)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-crimson-specimen)]" />
            <span>Guardrail Refusals</span>
          </div>
          <div className="text-sm font-bold text-[var(--color-crimson-specimen)]">
            {refusalCount} rejected queries
          </div>
          <span className="text-[10px] text-[var(--color-sage-gray)] block">
            Zero LLM tokens billed
          </span>
        </div>
      </div>
    </div>
  );
}
