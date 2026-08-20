"use client";

interface ProviderDistributionCardProps {
  distribution: Record<string, number>;
  totalQueries: number;
}

export function ProviderDistributionCard({
  distribution,
  totalQueries,
}: ProviderDistributionCardProps) {
  const geminiCount =
    distribution["gemini"] || distribution["gemini-2.5-flash"] || 0;
  const groqCount =
    distribution["groq"] || distribution["llama-3.3-70b-versatile"] || 0;
  const refusalCount =
    distribution["guardrail_refusal"] || distribution["refusal"] || 0;

  const geminiPct =
    totalQueries > 0 ? Math.round((geminiCount / totalQueries) * 100) : 0;
  const groqPct =
    totalQueries > 0 ? Math.round((groqCount / totalQueries) * 100) : 0;
  const refusalPct =
    totalQueries > 0 ? Math.round((refusalCount / totalQueries) * 100) : 0;

  return (
    <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 space-y-4">
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-1">
          PROVIDER TELEMETRY
        </span>
        <h3 className="text-lg font-medium text-[var(--color-olive-press)]">
          LLM Generation & Fallback Distribution
        </h3>
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
        <div
          style={{ width: `${refusalPct}%` }}
          className="bg-[var(--color-crimson-specimen)] h-full transition-all"
          title={`Refusals: ${refusalCount} (${refusalPct}%)`}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-forest-ink)]" />
          <span className="text-[var(--color-forest-ink)]">
            Gemini 2.5 Flash: <strong>{geminiCount}</strong> ({geminiPct}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-sage-leaf)]" />
          <span className="text-[var(--color-olive-press)]">
            Groq Llama 3.3: <strong>{groqCount}</strong> ({groqPct}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-crimson-specimen)]" />
          <span className="text-[var(--color-crimson-specimen)]">
            Refusals (&theta; &lt; 0.65): <strong>{refusalCount}</strong> (
            {refusalPct}%)
          </span>
        </div>
      </div>
    </div>
  );
}
