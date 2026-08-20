"use client";

import { CitationItem } from "@/types/chat";

interface CitationDrawerProps {
  citation: CitationItem | null;
  onClose: () => void;
}

export function CitationDrawer({ citation, onClose }: CitationDrawerProps) {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-slate-hollow)]/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] max-w-lg w-full p-6 space-y-5 text-[var(--color-forest-ink)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-mist)] pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-[var(--radius-tags)] bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)] font-mono text-xs font-semibold">
              [CITATION {citation.index}]
            </span>
            <span className="text-xs font-mono uppercase text-[var(--color-sage-leaf)]">
              {citation.category || "Datasheet Specimen"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-sm font-mono text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] cursor-pointer px-2 py-1"
            aria-label="Close citation drawer"
          >
            ✕ Close
          </button>
        </div>

        {/* Document Metadata Card */}
        <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] p-4 space-y-2">
          <h4 className="text-base font-medium text-[var(--color-olive-press)]">
            {citation.document_title}
          </h4>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[var(--color-sage-gray)]">
            <span>
              Section: <strong>{citation.section_title}</strong>
            </span>
            <span>·</span>
            <span>
              Page: <strong>{citation.page_number}</strong>
            </span>
            {citation.confidence_score !== undefined && (
              <>
                <span>·</span>
                <span className="text-[var(--color-forest-ink)]">
                  Relevance:{" "}
                  <strong>
                    {(citation.confidence_score * 100).toFixed(1)}%
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Excerpt Snippet */}
        <div>
          <span className="text-[11px] font-mono text-[var(--color-sage-leaf)] block mb-1.5 uppercase">
            VERIFIED GROUNDING EXCERPT:
          </span>
          <div className="p-3 bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] text-xs font-mono leading-relaxed text-[var(--color-forest-ink)] max-h-48 overflow-y-auto">
            {citation.excerpt ||
              "Verifiable context block extracted directly from PDF structure."}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-mist)] text-xs font-mono">
          <span className="text-[var(--color-sage-mist)]">
            Document ID: {citation.document_id}
          </span>
          <button
            onClick={() => {
              // Simulated raw source PDF preview
              window.open(`#`, "_blank");
            }}
            className="px-3 py-1.5 rounded-[var(--radius-buttons)] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] hover:bg-[var(--color-olive-press)] transition-colors cursor-pointer"
          >
            Preview Source PDF ↗
          </button>
        </div>
      </div>
    </div>
  );
}
