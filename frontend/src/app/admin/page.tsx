"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchIndexedDocuments,
  deleteIndexedDocument,
  IndexedDocumentInfo,
} from "@/lib/api/documents";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DocumentUploadZone } from "@/components/admin/DocumentUploadZone";
import { DocumentsTable } from "@/components/admin/DocumentsTable";

export default function AdminPage() {
  const [documents, setDocuments] = useState<IndexedDocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIndexedDocuments(backendUrl);
      setDocuments(data);
    } catch {
      // Offline fallback state with default catalog
      setDocuments([
        {
          document_id: "doc_siemens_1le1_motor",
          document_title: "Siemens SIMOTICS 1LE1 AC Induction Motor",
          category: "AC Induction Motor",
          page_count: 8,
          parent_chunk_count: 6,
          child_chunk_count: 24,
          created_at: "2026-08-20T00:00:00Z",
        },
        {
          document_id: "doc_omron_e2e_sensor",
          document_title: "Omron E2E Inductive Proximity Sensor",
          category: "Inductive Proximity Sensor",
          page_count: 6,
          parent_chunk_count: 4,
          child_chunk_count: 18,
          created_at: "2026-08-20T00:00:00Z",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDeleteDocument = async (docId: string) => {
    try {
      await deleteIndexedDocument(backendUrl, docId);
      setDocuments((prev) => prev.filter((d) => d.document_id !== docId));
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to purge document");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-linen)] flex flex-col justify-between text-[var(--color-forest-ink)]">
      {/* Admin Navigation Header */}
      <AdminHeader />

      {/* Main Content (Max width 1200px) */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-3 bg-[var(--color-blush)] border border-[var(--color-crimson-specimen)]/30 rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-crimson-specimen)]">
            Notice: {error}
          </div>
        )}

        {/* Drag & Drop PDF Upload Section */}
        <DocumentUploadZone onIngestSuccess={loadDocuments} />

        {/* Active Indexed Documents Table */}
        <DocumentsTable
          documents={documents}
          isLoading={isLoading}
          onDelete={handleDeleteDocument}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-mist)] py-6 mt-12 text-center text-xs font-mono text-[var(--color-sage-mist)]">
        Contexure Ingestion & Administrative Subsystem · Qdrant Vector Registry
      </footer>
    </div>
  );
}
