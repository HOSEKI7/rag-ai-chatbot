import Link from "next/link";

export function Hero() {
  return (
    <section className="py-24 flex flex-col items-start border-b border-[var(--color-mist)]">
      {/* Field Note Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-tags)] bg-[var(--surface-bone)] border border-[var(--color-mist)] mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-sage-leaf)]" />
        <span className="text-xs font-mono tracking-wider uppercase text-[var(--color-forest-ink)]">
          [SPECIMEN-CATALOG // INDUSTRIAL AUTOMATION]
        </span>
      </div>

      {/* Main Literary Serif Display Headline (Newsreader 300) */}
      <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-light text-[var(--color-olive-press)] leading-[0.98] tracking-tight mb-8 max-w-4xl">
        Deterministic intelligence for industrial machinery.
      </h1>

      {/* Subheading */}
      <p className="text-base sm:text-lg md:text-xl text-[var(--color-sage-gray)] font-normal leading-relaxed mb-10 max-w-2xl">
        Zero-hallucination technical support and datasheet exploration for
        motors, sensors, PLCs, and variable frequency drives with verifiable
        footnote citations.
      </p>

      {/* Dual CTA Buttons (Flat, Zero Drop Shadow) */}
      <div className="flex flex-wrap items-center gap-4 mb-16">
        <Link
          href="/chat"
          className="px-6 py-3 rounded-[var(--radius-buttons)] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] text-sm font-medium hover:bg-[var(--color-olive-press)] transition-colors cursor-pointer"
        >
          Start Technical Query →
        </Link>
        <a
          href="#architecture"
          className="px-6 py-3 rounded-[var(--radius-buttons)] border border-[var(--color-lichen)] text-[var(--color-olive-press)] text-sm font-medium hover:border-[var(--color-forest-ink)] hover:bg-[var(--surface-bone)] transition-all cursor-pointer"
        >
          Inspect Architecture ↓
        </a>
      </div>

      {/* Specimen Metrics & Badges Grid */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-[var(--color-mist)]">
        <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-4">
          <span className="text-[11px] font-mono text-[var(--color-sage-leaf)] block mb-1">
            PARSING FIDELITY
          </span>
          <span className="text-xl font-medium text-[var(--color-forest-ink)] block">
            Docling Layout
          </span>
          <span className="text-xs text-[var(--color-sage-gray)] mt-0.5 block">
            Preserves tabular structures
          </span>
        </div>

        <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-4">
          <span className="text-[11px] font-mono text-[var(--color-deep-teal)] block mb-1">
            LOCAL VECTOR ONNX
          </span>
          <span className="text-xl font-medium text-[var(--color-forest-ink)] block">
            768 Dimensions
          </span>
          <span className="text-xs text-[var(--color-sage-gray)] mt-0.5 block">
            nomic-embed-text-v1.5
          </span>
        </div>

        <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-4">
          <span className="text-[11px] font-mono text-[var(--color-amber-pin)] block mb-1">
            CROSS-ENCODER GATE
          </span>
          <span className="text-xl font-medium text-[var(--color-forest-ink)] block">
            θ ≥ 0.65 Cutoff
          </span>
          <span className="text-xs text-[var(--color-sage-gray)] mt-0.5 block">
            FlashRank CPU reranking
          </span>
        </div>

        <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-4">
          <span className="text-[11px] font-mono text-[var(--color-crimson-specimen)] block mb-1">
            FAILOVER REDUNDANCY
          </span>
          <span className="text-xl font-medium text-[var(--color-forest-ink)] block">
            Gemini + Groq
          </span>
          <span className="text-xs text-[var(--color-sage-gray)] mt-0.5 block">
            Automatic 429 failover
          </span>
        </div>
      </div>
    </section>
  );
}
