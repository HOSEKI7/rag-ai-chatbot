"use client";

interface TopDocumentsLeaderboardProps {
  topDocuments: Array<{ document_id: string; count: number }>;
}

export function TopDocumentsLeaderboard({
  topDocuments,
}: TopDocumentsLeaderboardProps) {
  return (
    <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-1">
            RETRIEVAL FREQUENCY
          </span>
          <h3 className="text-lg font-medium text-[var(--color-olive-press)]">
            Most-Retrieved Source Datasheets
          </h3>
        </div>
      </div>

      <p className="text-xs text-[var(--color-sage-gray)] font-sans">
        Rankings of equipment documentation chunks accessed most frequently
        during vector search and synthesis.
      </p>

      {topDocuments.length === 0 ? (
        <div className="py-6 text-center text-xs font-mono text-[var(--color-sage-mist)] border border-dashed border-[var(--color-mist)] rounded-[var(--radius-inputs)] bg-[var(--surface-linen)]">
          No retrieval accesses recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {topDocuments.map((doc, idx) => (
            <div
              key={doc.document_id}
              className="p-3 rounded-[var(--radius-inputs)] bg-[var(--surface-linen)] border border-[var(--color-mist)] flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-[var(--surface-bone)] border border-[var(--color-mist)] flex items-center justify-center font-bold text-[10px] text-[var(--color-forest-ink)] shrink-0">
                  {idx + 1}
                </span>
                <span className="font-medium text-[var(--color-forest-ink)] truncate">
                  {doc.document_id}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-[var(--radius-tags)] bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)] font-semibold shrink-0">
                {doc.count} {doc.count === 1 ? "hit" : "hits"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
