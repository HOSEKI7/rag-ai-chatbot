"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchIndexedDocuments,
  deleteIndexedDocument,
  IndexedDocumentInfo,
} from "@/lib/api/documents";
import { AuthGate } from "@/components/admin/AuthGate";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DocumentUploadZone } from "@/components/admin/DocumentUploadZone";
import { DocumentsTable } from "@/components/admin/DocumentsTable";

export default function AdminPage() {
  const [documents, setDocuments] = useState<IndexedDocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIndexedDocuments();
      setDocuments(data);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to load indexed documents.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDeleteDocument = async (docId: string) => {
    try {
      await deleteIndexedDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.document_id !== docId));
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to purge document");
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-[var(--surface-linen)] flex flex-col justify-between text-[var(--color-forest-ink)]">
        {/* Admin Navigation Header */}
        <AdminHeader />

        {/* Main Content (Max width 1200px) */}
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-12">
          {error && (
            <div className="mb-6 p-3 bg-[var(--color-blush)] border border-[var(--color-crimson-specimen)]/30 rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-crimson-specimen)] flex items-center justify-between">
              <span>Notice: {error}</span>
              <button
                onClick={() => setError(null)}
                className="underline cursor-pointer"
              >
                Dismiss
              </button>
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
          Contexure Ingestion & Administrative Subsystem · Qdrant Knowledge Base
        </footer>
      </div>
    </AuthGate>
  );
}
