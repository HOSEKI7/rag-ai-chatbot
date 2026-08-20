"use client";

import React, { useState, useRef } from "react";
import { uploadDatasheet, IngestResult } from "@/lib/api/documents";

interface DocumentUploadZoneProps {
  onIngestSuccess: (result: IngestResult) => void;
}

const CATEGORIES = [
  "AC Induction Motor",
  "Inductive Proximity Sensor",
  "Variable Frequency Drive",
  "Programmable Logic Controller",
  "Industrial Equipment Datasheet",
];

const INGESTION_STAGES = [
  "1. Parsing PDF layout & tabular matrices...",
  "2. Segmenting Hierarchical Parent & Child Chunks...",
  "3. Generating 768-dim local ONNX vector embeddings...",
  "4. Storing vectors & payload indices in Qdrant Cloud...",
];

export function DocumentUploadZone({
  onIngestSuccess,
}: DocumentUploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<IngestResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF technical documentation is supported.");
      return;
    }
    setFile(selectedFile);
    setError(null);
    if (!title) {
      const cleanName = selectedFile.name
        .replace(/\.pdf$/i, "")
        .replace(/[_-]/g, " ");
      setTitle(cleanName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setError(null);
    setSuccessResult(null);
    setCurrentStage(0);

    const stageInterval = setInterval(() => {
      setCurrentStage((prev) =>
        prev < INGESTION_STAGES.length - 1 ? prev + 1 : prev
      );
    }, 650);

    try {
      const result = await uploadDatasheet(file, title, category);
      clearInterval(stageInterval);
      setCurrentStage(INGESTION_STAGES.length - 1);
      setSuccessResult(result);
      onIngestSuccess(result);
      setFile(null);
      setTitle("");
    } catch (err: unknown) {
      clearInterval(stageInterval);
      setError((err as Error)?.message || "Failed to ingest source document.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 md:p-8 mb-12">
      {/* Section Header */}
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-1">
          INGESTION SUBSYSTEM
        </span>
        <h2 className="text-2xl font-normal text-[var(--color-olive-press)] tracking-tight">
          Source Document Ingestion
        </h2>
        <p className="text-xs text-[var(--color-sage-gray)] mt-1 font-mono">
          Upload equipment datasheets to automatically parse, chunk, embed, and
          index in Qdrant Cloud.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dropzone Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[var(--radius-cards)] p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-[var(--color-forest-ink)] bg-[var(--color-eucalyptus)]/20"
              : file
                ? "border-[var(--color-sage-leaf)] bg-[var(--surface-linen)]"
                : "border-[var(--color-mist)] bg-[var(--surface-linen)] hover:border-[var(--color-lichen)]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-bone)] border border-[var(--color-mist)] flex items-center justify-center text-[var(--color-sage-gray)]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--color-forest-ink)]">
              {file ? file.name : "Drag & drop industrial PDF datasheet here"}
            </span>
            <span className="text-xs font-mono text-[var(--color-sage-gray)]">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB · Ready to ingest`
                : "Or browse file from device (.pdf only)"}
            </span>
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono text-[var(--color-forest-ink)] block mb-1.5 font-semibold">
              DOCUMENT TITLE / MODEL
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Siemens SIMOTICS 1LE1 AC Motor"
              className="w-full px-3.5 py-2.5 bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-forest-ink)] focus:outline-none focus:border-[var(--color-forest-ink)]"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[var(--color-forest-ink)] block mb-1.5 font-semibold">
              EQUIPMENT CATEGORY
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-forest-ink)] focus:outline-none focus:border-[var(--color-forest-ink)] cursor-pointer"
            >
              {CATEGORIES.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ingestion Progress Tracker */}
        {isUploading && (
          <div className="p-4 bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] space-y-3">
            <span className="text-xs font-mono font-semibold text-[var(--color-sage-leaf)] block">
              INGESTION PIPELINE IN PROGRESS...
            </span>
            <div className="space-y-1.5">
              {INGESTION_STAGES.map((st, i) => (
                <div
                  key={i}
                  className={`text-xs font-mono flex items-center gap-2 ${
                    i < currentStage
                      ? "text-[var(--color-forest-ink)] font-medium"
                      : i === currentStage
                        ? "text-[var(--color-olive-press)] font-bold animate-pulse"
                        : "text-[var(--color-sage-mist)]"
                  }`}
                >
                  <span>
                    {i < currentStage ? "✓" : i === currentStage ? "▶" : "○"}
                  </span>
                  <span>{st}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Banner */}
        {successResult && (
          <div className="p-4 bg-[var(--color-eucalyptus)]/30 border border-[var(--color-lichen)] rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-forest-ink)] space-y-1">
            <span className="font-bold block">✓ INGESTION COMPLETE</span>
            <p>{successResult.message}</p>
            <span className="text-[11px] text-[var(--color-sage-gray)] block">
              Document ID: {successResult.document_id} ·{" "}
              {successResult.page_count} Pages ·{" "}
              {successResult.child_chunk_count} Searchable Child Vectors Indexed
            </span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-[var(--color-blush)] border border-[var(--color-crimson-specimen)]/30 rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-crimson-specimen)]">
            Error: {error}
          </div>
        )}

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={!file || isUploading}
            className="px-6 py-2.5 rounded-[var(--radius-buttons)] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] text-xs font-medium hover:bg-[var(--color-olive-press)] transition-colors disabled:opacity-40 cursor-pointer"
          >
            {isUploading ? "Processing Pipeline..." : "Ingest Document →"}
          </button>
        </div>
      </form>
    </div>
  );
}
