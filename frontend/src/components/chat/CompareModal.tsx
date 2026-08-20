"use client";

import React, { useState, useEffect } from "react";
import {
  fetchIndexedDocuments,
  IndexedDocumentInfo,
} from "@/lib/api/documents";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompare: (docIds: string[], queryText: string) => void;
}

const FALLBACK_DOCUMENTS: IndexedDocumentInfo[] = [
  {
    document_id: "doc_siemens_1le1_motor",
    document_title: "Siemens SIMOTICS 1LE1 AC Motor",
    category: "AC Motor",
    page_count: 12,
    parent_chunk_count: 12,
    child_chunk_count: 36,
    created_at: "2026-08-20T00:00:00Z",
  },
  {
    document_id: "doc_abb_acs580_drive",
    document_title: "ABB ACS580 General Purpose VFD",
    category: "VFD Drive",
    page_count: 14,
    parent_chunk_count: 14,
    child_chunk_count: 42,
    created_at: "2026-08-20T00:00:00Z",
  },
  {
    document_id: "doc_omron_e2e_sensor",
    document_title: "Omron E2E Inductive Proximity Sensor",
    category: "Sensor",
    page_count: 8,
    parent_chunk_count: 8,
    child_chunk_count: 24,
    created_at: "2026-08-20T00:00:00Z",
  },
  {
    document_id: "doc_mitsubishi_iqr_plc",
    document_title: "Mitsubishi MELSEC iQ-R Series PLC",
    category: "PLC Controller",
    page_count: 16,
    parent_chunk_count: 16,
    child_chunk_count: 48,
    created_at: "2026-08-20T00:00:00Z",
  },
];

export function CompareModal({
  isOpen,
  onClose,
  onCompare,
}: CompareModalProps) {
  const [documents, setDocuments] =
    useState<IndexedDocumentInfo[]>(FALLBACK_DOCUMENTS);
  const [docA, setDocA] = useState<string>(FALLBACK_DOCUMENTS[0].document_id);
  const [docB, setDocB] = useState<string>(FALLBACK_DOCUMENTS[1].document_id);

  useEffect(() => {
    if (isOpen) {
      fetchIndexedDocuments()
        .then((docs) => {
          if (docs && docs.length >= 2) {
            setDocuments(docs);
            setDocA(docs[0].document_id);
            setDocB(docs[1].document_id);
          }
        })
        .catch(() => {
          // Keep fallback catalog documents
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (docA === docB) {
      alert("Please select two distinct equipment datasheets to compare.");
      return;
    }

    const titleA =
      documents.find((d) => d.document_id === docA)?.document_title || docA;
    const titleB =
      documents.find((d) => d.document_id === docB)?.document_title || docB;

    const queryText = `Compare technical specifications and operating parameters between ${titleA} and ${titleB}.`;
    onCompare([docA, docB], queryText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-slate-hollow)]/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] max-w-xl w-full p-6 space-y-6 text-[var(--color-forest-ink)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-mist)] pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-[var(--radius-tags)] bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)] font-mono text-xs font-semibold uppercase tracking-[0.04em]">
              SPECIFICATION COMPARISON
            </span>
            <span className="text-xs font-mono uppercase tracking-[0.04em] text-[var(--color-sage-leaf)]">
              MULTI-DOCUMENT RAG
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-sans text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] cursor-pointer px-2 py-1"
          >
            Close ✕
          </button>
        </div>

        <div>
          <h3 className="text-xl font-medium text-[var(--color-olive-press)] font-sans">
            Compare Equipment Datasheets Side-by-Side
          </h3>
          <p className="text-xs text-[var(--color-sage-gray)] mt-1 font-sans">
            Select two indexed technical datasheets to automatically extract,
            align, and compare parameter deltas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
          {/* Document Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-[0.04em] text-[var(--color-forest-ink)] block mb-1.5 font-semibold">
                EQUIPMENT SPECIMEN A
              </label>
              <select
                value={docA}
                onChange={(e) => setDocA(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] text-xs font-sans text-[var(--color-forest-ink)] focus:outline-none focus:border-[var(--color-forest-ink)] cursor-pointer"
              >
                {documents.map((doc) => (
                  <option key={doc.document_id} value={doc.document_id}>
                    {doc.document_title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-[0.04em] text-[var(--color-forest-ink)] block mb-1.5 font-semibold">
                EQUIPMENT SPECIMEN B
              </label>
              <select
                value={docB}
                onChange={(e) => setDocB(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] text-xs font-sans text-[var(--color-forest-ink)] focus:outline-none focus:border-[var(--color-forest-ink)] cursor-pointer"
              >
                {documents.map((doc) => (
                  <option key={doc.document_id} value={doc.document_id}>
                    {doc.document_title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-mist)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--radius-buttons)] border border-[var(--color-mist)] text-[var(--color-forest-ink)] text-xs font-medium hover:bg-[var(--surface-bone)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-[var(--radius-buttons)] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] text-xs font-medium hover:bg-[var(--color-olive-press)] transition-colors cursor-pointer"
            >
              Generate Comparison Matrix →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
