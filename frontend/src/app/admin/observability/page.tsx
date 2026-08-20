"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchAnalyticsMetrics,
  AggregatedAnalytics,
} from "@/lib/api/analytics";
import { AuthGate } from "@/components/admin/AuthGate";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MetricsKpiGrid } from "@/components/admin/analytics/MetricsKpiGrid";
import { ProviderDistributionCard } from "@/components/admin/analytics/ProviderDistributionCard";
import { RejectedQueriesTable } from "@/components/admin/analytics/RejectedQueriesTable";
import { RecentTracesTable } from "@/components/admin/analytics/RecentTracesTable";

export default function ObservabilityDashboardPage() {
  const [metrics, setMetrics] = useState<AggregatedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAnalyticsMetrics();
      setMetrics(data);
    } catch (err: unknown) {
      setError(
        (err as Error)?.message || "Failed to load telemetry analytics."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <AuthGate>
      <div className="min-h-screen bg-[var(--surface-linen)] flex flex-col justify-between text-[var(--color-forest-ink)]">
        {/* Navigation Header */}
        <AdminHeader />

        {/* Main Observability Content */}
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-12 space-y-8">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-mist)] pb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-1">
                SYSTEM OBSERVABILITY
              </span>
              <h1 className="text-3xl font-medium text-[var(--color-olive-press)] tracking-tight">
                RAG Telemetry & Analytics
              </h1>
              <p className="text-xs font-mono text-[var(--color-sage-gray)] mt-1">
                Real-time query volume, cross-encoder confidence distributions,
                and provider fallback telemetry.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="px-3.5 py-1.5 rounded-[var(--radius-buttons)] border border-[var(--color-lichen)] text-xs font-medium text-[var(--color-olive-press)] hover:bg-[var(--surface-bone)] transition-colors"
              >
                ← Document Ingestion
              </Link>
              <button
                onClick={loadMetrics}
                className="px-4 py-1.5 rounded-[var(--radius-buttons)] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] text-xs font-medium hover:bg-[var(--color-olive-press)] transition-colors cursor-pointer"
              >
                Refresh Telemetry ⟳
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[var(--color-blush)] border border-[var(--color-crimson-specimen)]/30 rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-crimson-specimen)] flex items-center justify-between">
              <span>Notice: {error}</span>
              <button
                onClick={() => setError(null)}
                className="underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {isLoading || !metrics ? (
            <div className="py-24 text-center text-xs font-mono text-[var(--color-sage-gray)]">
              Aggregating RAG telemetry & trace stream...
            </div>
          ) : (
            <>
              {/* Top KPI Grid */}
              <MetricsKpiGrid metrics={metrics} />

              {/* Provider Distribution Telemetry */}
              <ProviderDistributionCard
                distribution={metrics.provider_distribution}
                totalQueries={metrics.total_queries}
              />

              {/* Knowledge Gap Triage Table */}
              <RejectedQueriesTable
                rejectedQueries={metrics.rejected_queries}
              />

              {/* Recent Traces Table */}
              <RecentTracesTable traces={metrics.recent_traces} />
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--color-mist)] py-6 mt-12 text-center text-xs font-mono text-[var(--color-sage-mist)]">
          Contexure Telemetry & Observability Subsystem · Live Metrics Stream
        </footer>
      </div>
    </AuthGate>
  );
}
