"use client";

import { QueryTraceItem } from "@/lib/api/analytics";

interface RejectedQueriesTableProps {
  rejectedQueries: QueryTraceItem[];
}

export function RejectedQueriesTable({
  rejectedQueries,
}: RejectedQueriesTableProps) {
  return (
    <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-crimson-specimen)] block mb-1">
            KNOWLEDGE GAP TRIAGE
          </span>
          <h3 className="text-lg font-medium text-[var(--color-olive-press)]">
            Rejected & Out-of-Scope Queries
          </h3>
        </div>
        <span className="text-xs font-mono text-[var(--color-sage-gray)]">
          Total Gaps: <strong>{rejectedQueries.length}</strong>
        </span>
      </div>

      <p className="text-xs text-[var(--color-sage-gray)] font-sans">
        Inquiries rejected by the cross-encoder guardrail (&theta; &lt; 0.65).
        Use this log to identify missing equipment models and upload required
        datasheets.
      </p>

      {rejectedQueries.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-[var(--color-sage-mist)] border border-dashed border-[var(--color-mist)] rounded-[var(--radius-inputs)] bg-[var(--surface-linen)]">
          No guardrail refusals recorded. All historical queries met the
          grounding confidence threshold.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--color-mist)] text-[var(--color-sage-gray)] uppercase text-[10px]">
                <th className="py-2.5 px-3">Rejected Query</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-center">Timestamp</th>
                <th className="py-2.5 px-3 text-left">Refusal Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-mist)]">
              {rejectedQueries.map((t, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[var(--surface-linen)]/50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-medium text-[var(--color-forest-ink)] max-w-xs truncate">
                    &ldquo;{t.query}&rdquo;
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--color-crimson-specimen)] font-bold">
                    {(t.confidence_score * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--color-sage-gray)] text-[10px]">
                    {new Date(t.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--color-sage-gray)] text-[11px] max-w-sm truncate">
                    {t.refusal_reason || "Confidence below 0.65 threshold"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
