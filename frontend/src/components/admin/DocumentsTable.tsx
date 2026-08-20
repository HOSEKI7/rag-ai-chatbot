"use client";

import { useState } from "react";
import { IndexedDocumentInfo } from "@/lib/api/documents";

interface DocumentsTableProps {
  documents: IndexedDocumentInfo[];
  isLoading: boolean;
  onDelete: (documentId: string) => Promise<void>;
}

export function DocumentsTable({
  documents,
  isLoading,
  onDelete,
}: DocumentsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (docId: string) => {
    if (
      confirm(
        `Are you sure you want to purge all vector chunks for document '${docId}'?`
      )
    ) {
      setDeletingId(docId);
      try {
        await onDelete(docId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 md:p-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-1">
            VECTOR STORE REGISTRY
          </span>
          <h2 className="text-2xl font-normal text-[var(--color-olive-press)] tracking-tight">
            Active Knowledge Base Documents
          </h2>
        </div>
        <span className="text-xs font-mono text-[var(--color-sage-gray)]">
          Total Indexed: <strong>{documents.length}</strong> source documents
        </span>
      </div>

      {/* Documents Table */}
      {isLoading ? (
        <div className="py-12 text-center text-xs font-mono text-[var(--color-sage-gray)]">
          Loading indexed knowledge base documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="py-12 text-center text-xs font-mono text-[var(--color-sage-mist)] border border-dashed border-[var(--color-mist)] rounded-[var(--radius-inputs)] bg-[var(--surface-linen)]">
          No industrial datasheets indexed in Qdrant yet. Upload a PDF above to
          begin.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--color-mist)] text-[var(--color-sage-gray)] uppercase text-[10px]">
                <th className="py-3 px-3">Document Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Pages</th>
                <th className="py-3 px-3 text-center">Parent Chunks</th>
                <th className="py-3 px-3 text-center">Child Chunks</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-mist)]">
              {documents.map((doc) => (
                <tr
                  key={doc.document_id}
                  className="hover:bg-[var(--surface-linen)]/50 transition-colors"
                >
                  <td className="py-3 px-3 font-medium text-[var(--color-forest-ink)]">
                    <span className="block">{doc.document_title}</span>
                    <span className="text-[10px] text-[var(--color-sage-mist)] block font-normal">
                      {doc.document_id}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-[var(--radius-tags)] bg-[var(--surface-linen)] border border-[var(--color-mist)] text-[var(--color-sage-gray)] text-[10px]">
                      {doc.category || "Datasheet"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-[var(--color-forest-ink)]">
                    {doc.page_count}
                  </td>
                  <td className="py-3 px-3 text-center text-[var(--color-forest-ink)]">
                    {doc.parent_chunk_count}
                  </td>
                  <td className="py-3 px-3 text-center text-[var(--color-forest-ink)] font-semibold">
                    {doc.child_chunk_count}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDelete(doc.document_id)}
                      disabled={deletingId === doc.document_id}
                      className="px-2.5 py-1 rounded-[var(--radius-buttons)] border border-[var(--color-lichen)] text-[var(--color-crimson-specimen)] hover:border-[var(--color-crimson-specimen)] hover:bg-[var(--color-blush)]/40 transition-all cursor-pointer text-[10px] disabled:opacity-40"
                    >
                      {deletingId === doc.document_id
                        ? "Purging..."
                        : "Purge 🗑"}
                    </button>
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
