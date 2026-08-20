"use client";

import { QueryTraceItem } from "@/lib/api/analytics";

interface RecentTracesTableProps {
  traces: QueryTraceItem[];
}

export function RecentTracesTable({ traces }: RecentTracesTableProps) {
  return (
    <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-1">
            TELEMETRY STREAM
          </span>
          <h3 className="text-lg font-medium text-[var(--color-olive-press)]">
            Recent Query Trace Stream
          </h3>
        </div>
        <span className="text-xs font-mono text-[var(--color-sage-gray)]">
          Latest {traces.length} traces
        </span>
      </div>

      {traces.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-[var(--color-sage-mist)] border border-dashed border-[var(--color-mist)] rounded-[var(--radius-inputs)] bg-[var(--surface-linen)]">
          No query traces logged yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--color-mist)] text-[var(--color-sage-gray)] uppercase text-[10px]">
                <th className="py-2.5 px-3">Query</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Confidence</th>
                <th className="py-2.5 px-3 text-center">Provider</th>
                <th className="py-2.5 px-3 text-center">Total Latency</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-mist)]">
              {traces.map((t, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[var(--surface-linen)]/50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-medium text-[var(--color-forest-ink)] max-w-xs truncate">
                    {t.query}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-[var(--radius-tags)] text-[10px] ${
                        t.passed_guardrail
                          ? "bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)]"
                          : "bg-[var(--color-blush)] text-[var(--color-crimson-specimen)]"
                      }`}
                    >
                      {t.passed_guardrail ? "PASSED" : "REFUSAL"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--color-forest-ink)] font-semibold">
                    {(t.confidence_score * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-[var(--radius-tags)] bg-[var(--surface-linen)] border border-[var(--color-mist)] text-[var(--color-sage-gray)] text-[10px] uppercase">
                      {t.provider}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--color-forest-ink)]">
                    {t.latency_ms}ms
                  </td>
                  <td className="py-2.5 px-3 text-right text-[var(--color-sage-gray)] text-[10px]">
                    {new Date(t.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
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
