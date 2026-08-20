"use client";

import React, { useState } from "react";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompare: (docIds: string[], queryText: string) => void;
}

const DEFAULT_DOCUMENTS = [
  {
    id: "doc_siemens_1le1_motor",
    title: "Siemens SIMOTICS 1LE1 AC Motor",
    category: "AC Motor",
  },
  {
    id: "doc_abb_acs580_drive",
    title: "ABB ACS580 General Purpose VFD",
    category: "VFD Drive",
  },
  {
    id: "doc_omron_e2e_sensor",
    title: "Omron E2E Inductive Proximity Sensor",
    category: "Sensor",
  },
  {
    id: "doc_mitsubishi_iqr_plc",
    title: "Mitsubishi MELSEC iQ-R Series PLC",
    category: "PLC Controller",
  },
];

const COMPARISON_ATTRIBUTES = [
  "Rated Output Power & Torque",
  "Operating Voltage & Frequency",
  "Efficiency Rating & Standards",
  "Enclosure Protection (IP Rating)",
  "Communication & Fieldbus Protocols",
];

export function CompareModal({
  isOpen,
  onClose,
  onCompare,
}: CompareModalProps) {
  const [docA, setDocA] = useState(DEFAULT_DOCUMENTS[0].id);
  const [docB, setDocB] = useState(DEFAULT_DOCUMENTS[1].id);
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>([
    COMPARISON_ATTRIBUTES[0],
    COMPARISON_ATTRIBUTES[1],
    COMPARISON_ATTRIBUTES[2],
  ]);

  if (!isOpen) return null;

  const handleToggleAttr = (attr: string) => {
    setSelectedAttrs((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (docA === docB) {
      alert("Please select two distinct equipment datasheets to compare.");
      return;
    }

    const titleA = DEFAULT_DOCUMENTS.find((d) => d.id === docA)?.title || docA;
    const titleB = DEFAULT_DOCUMENTS.find((d) => d.id === docB)?.title || docB;

    const queryText = `Compare technical specifications between ${titleA} and ${titleB} with focus on: ${selectedAttrs.join(", ")}.`;
    onCompare([docA, docB], queryText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-slate-hollow)]/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] max-w-xl w-full p-6 space-y-6 text-[var(--color-forest-ink)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-mist)] pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-[var(--radius-tags)] bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)] font-mono text-xs font-semibold">
              SPECIFICATION COMPARISON
            </span>
            <span className="text-xs font-mono text-[var(--color-sage-leaf)]">
              Multi-Document RAG
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-sm font-mono text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] cursor-pointer px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        <div>
          <h3 className="text-xl font-medium text-[var(--color-olive-press)]">
            Compare Equipment Datasheets Side-by-Side
          </h3>
          <p className="text-xs text-[var(--color-sage-gray)] mt-1 font-sans">
            Select two indexed technical datasheets to automatically extract,
            align, and compare parameter deltas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Document Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[var(--color-forest-ink)] block mb-1.5 font-semibold">
                EQUIPMENT SPECIMEN A
              </label>
              <select
                value={docA}
                onChange={(e) => setDocA(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-forest-ink)] focus:outline-none focus:border-[var(--color-forest-ink)] cursor-pointer"
              >
                {DEFAULT_DOCUMENTS.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-[var(--color-forest-ink)] block mb-1.5 font-semibold">
                EQUIPMENT SPECIMEN B
              </label>
              <select
                value={docB}
                onChange={(e) => setDocB(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-forest-ink)] focus:outline-none focus:border-[var(--color-forest-ink)] cursor-pointer"
              >
                {DEFAULT_DOCUMENTS.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Attributes */}
          <div>
            <label className="text-xs font-mono text-[var(--color-forest-ink)] block mb-2 font-semibold">
              FOCUS COMPARISON ATTRIBUTES
            </label>
            <div className="space-y-2">
              {COMPARISON_ATTRIBUTES.map((attr, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-2.5 text-xs font-mono text-[var(--color-forest-ink)] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedAttrs.includes(attr)}
                    onChange={() => handleToggleAttr(attr)}
                    className="rounded-xs border-[var(--color-mist)] text-[var(--color-forest-ink)] cursor-pointer"
                  />
                  <span>{attr}</span>
                </label>
              ))}
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
