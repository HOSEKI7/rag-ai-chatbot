"use client";

import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { SpecimenCatalog } from "@/components/landing/SpecimenCatalog";
import { Footer } from "@/components/landing/Footer";

export default function DatasheetsPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-linen)] flex flex-col justify-between text-[var(--color-forest-ink)]">
      {/* Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] flex items-center gap-1 mb-4"
          >
            ← Back to Home
          </Link>
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-1">
            INDUSTRIAL KNOWLEDGE BASE
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-olive-press)] tracking-tight">
            Indexed Technical Datasheets
          </h1>
          <p className="text-sm text-[var(--color-sage-gray)] mt-2 max-w-xl font-normal leading-relaxed">
            Browse verified industrial machinery equipment documentation. Select
            any datasheet to query specifications, pinouts, wiring diagrams, and
            operating ratings in the interactive chat workspace.
          </p>
        </div>

        {/* Specimen Catalog */}
        <SpecimenCatalog />

        {/* Admin Link Callout */}
        <div className="mt-12 p-6 bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-[var(--color-sage-leaf)] block font-semibold">
              ADMINISTRATIVE PORTAL
            </span>
            <span className="text-sm font-medium text-[var(--color-forest-ink)] block mt-0.5">
              Need to upload or index new equipment datasheets into Qdrant?
            </span>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-[var(--radius-buttons)] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] text-xs font-mono font-medium hover:bg-[var(--color-olive-press)] transition-colors cursor-pointer whitespace-nowrap"
          >
            Open Ingestion Portal →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
