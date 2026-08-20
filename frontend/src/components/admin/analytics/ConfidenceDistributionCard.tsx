"use client";

import { ConfidenceBucketItem } from "@/lib/api/analytics";

interface ConfidenceDistributionCardProps {
  distribution?: ConfidenceBucketItem[];
  totalQueries: number;
}

export function ConfidenceDistributionCard({
  distribution = [],
  totalQueries,
}: ConfidenceDistributionCardProps) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 space-y-4">
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-1">
          RETRIEVAL QUALITY METRICS
        </span>
        <h3 className="text-lg font-medium text-[var(--color-olive-press)]">
          Confidence Score Distribution Histogram
        </h3>
        <p className="text-xs text-[var(--color-sage-gray)] mt-1 font-sans">
          Cross-encoder calibrated scoring distribution across all historical
          queries. Scores below 0.65 trigger deterministic guardrail refusals.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {distribution.map((bucket, idx) => {
          const pct =
            totalQueries > 0
              ? Math.round((bucket.count / totalQueries) * 100)
              : 0;
          const barWidth = Math.max(
            (bucket.count / maxCount) * 100,
            bucket.count > 0 ? 4 : 0
          );

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--color-forest-ink)] font-medium">
                  {bucket.label}
                </span>
                <span className="text-[var(--color-sage-gray)]">
                  {bucket.count} queries ({pct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-full overflow-hidden">
                <div
                  style={{ width: `${barWidth}%` }}
                  className={`h-full rounded-full transition-all ${
                    idx === 0
                      ? "bg-[var(--color-blush)] border border-[var(--color-crimson-specimen)]/40"
                      : "bg-[var(--color-sage-leaf)]"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
