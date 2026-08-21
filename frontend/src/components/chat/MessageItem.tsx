"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChatMessage, CitationItem } from "@/types/chat";
import { downloadTechnicalReportPdf } from "@/lib/utils/pdfExport";

interface MessageItemProps {
  message: ChatMessage;
  originatingQuery?: string;
  onCitationClick: (citation: CitationItem) => void;
}

export function MessageItem({
  message,
  originatingQuery,
  onCitationClick,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      downloadTechnicalReportPdf({
        query: originatingQuery || "Technical Inquiry",
        answerContent: message.content,
        confidenceScore: message.confidence_score ?? 1.0,
        citations: message.citations || [],
        timestamp: message.timestamp,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to render text with interactive clickable citation badges
  const renderInlineCitations = (text: string, citations?: CitationItem[]) => {
    if (!text) return null;

    const regex = /\[(\d+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const citationNumber = parseInt(match[1], 10);

      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      const matchedCitation = citations?.find(
        (c) => c.index === citationNumber
      );

      parts.push(
        <button
          key={`cite-${matchIndex}`}
          onClick={() => {
            if (matchedCitation) {
              onCitationClick(matchedCitation);
            }
          }}
          className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-[var(--radius-tags)] bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)] hover:bg-[var(--color-lichen)] border border-[var(--color-lichen)] text-[11px] font-mono font-medium transition-colors cursor-pointer align-baseline"
          title={
            matchedCitation
              ? `${matchedCitation.document_title} (Page ${matchedCitation.page_number})`
              : `Citation ${citationNumber}`
          }
        >
          [{citationNumber}]
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Helper to parse markdown blocks including comparison tables
  const renderFormattedBlocks = (
    content: string,
    citations?: CitationItem[]
  ) => {
    if (!content) return null;

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    const flushTable = (key: number) => {
      if (tableBuffer.length < 2) {
        elements.push(
          <div key={`plain-table-${key}`} className="whitespace-pre-wrap">
            {renderInlineCitations(tableBuffer.join("\n"), citations)}
          </div>
        );
        tableBuffer = [];
        return;
      }

      const headers = tableBuffer[0]
        .split("|")
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map((h) => h.trim());

      // Row 1 is divider (|---|---|)
      const dataRows = tableBuffer.slice(2).map((row) =>
        row
          .split("|")
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map((cell) => cell.trim())
      );

      elements.push(
        <div
          key={`table-block-${key}`}
          className="overflow-x-auto my-4 border border-[var(--color-mist)] rounded-[var(--radius-inputs)] bg-[var(--surface-bone)]"
        >
          <table className="w-full text-xs font-mono border-collapse divide-y divide-[var(--color-mist)]">
            <thead className="bg-[var(--surface-bone)] text-[var(--color-olive-press)]">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3.5 text-left font-semibold">
                    {renderInlineCitations(h, citations)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[var(--surface-linen)] divide-y divide-[var(--color-mist)]">
              {dataRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-[var(--surface-bone)]/50 transition-colors"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-2.5 px-3.5 text-left text-[var(--color-forest-ink)]"
                    >
                      {renderInlineCitations(cell, citations)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
    };

    lines.forEach((line, idx) => {
      const isTableRow =
        line.trim().startsWith("|") && line.trim().endsWith("|");

      if (isTableRow) {
        inTable = true;
        tableBuffer.push(line);
      } else {
        if (inTable) {
          inTable = false;
          flushTable(idx);
        }
        elements.push(
          <div key={`line-${idx}`} className="min-h-[1.25rem]">
            {renderInlineCitations(line, citations)}
          </div>
        );
      }
    });

    if (inTable && tableBuffer.length > 0) {
      flushTable(lines.length);
    }

    return elements;
  };

  return (
    <div
      className={`w-full flex flex-col py-6 border-b border-[var(--color-mist)] ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div className="max-w-3xl w-full">
        {/* Author Label, Timestamp, Provider & PDF Export Action */}
        <div className="flex items-center justify-between mb-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            {!isUser && (
              <Image
                src="/contexure.webp"
                alt="Contexure Agent"
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
            )}
            <span
              className={`font-semibold ${
                isUser
                  ? "text-[var(--color-olive-press)]"
                  : "text-[var(--color-sage-leaf)]"
              }`}
            >
              {isUser ? "You" : "Contexure Agent"}
            </span>
            <span className="text-[var(--color-sage-mist)]">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {!isUser && message.provider && (
              <span className="text-[10px] px-2 py-0.5 rounded-[var(--radius-tags)] bg-[var(--surface-bone)] border border-[var(--color-mist)] text-[var(--color-sage-gray)] uppercase">
                {message.provider}
              </span>
            )}
          </div>

          {!isUser &&
            !message.isStreaming &&
            message.content &&
            message.passed_guardrail !== false && (
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="text-[11px] font-mono px-2.5 py-1 rounded-[var(--radius-buttons)] bg-[var(--surface-bone)] hover:bg-[var(--color-lichen)] border border-[var(--color-mist)] text-[var(--color-forest-ink)] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Export technical report to PDF"
              >
                <span>{isExporting ? "Exporting..." : "Export PDF ↓"}</span>
              </button>
            )}
        </div>

        {/* Guardrail Refusal Alert */}
        {message.passed_guardrail === false && (
          <div className="mb-3 p-3 bg-[var(--color-blush)] border border-[var(--color-crimson-specimen)]/30 rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-crimson-specimen)]">
            <span className="font-semibold block mb-1">
              [GUARDRAIL REFUSAL · CONFIDENCE BELOW 0.65 THRESHOLD]
            </span>
            <span>
              {message.refusal_message ||
                "This technical inquiry cannot be verified against the indexed datasheets."}
            </span>
          </div>
        )}

        {/* Message Bubble / Content */}
        <div
          className={`rounded-[var(--radius-cards)] p-5 text-sm leading-relaxed ${
            isUser
              ? "bg-[var(--surface-bone)] border border-[var(--color-mist)] text-[var(--color-forest-ink)] font-mono"
              : "bg-[var(--surface-linen)] text-[var(--color-forest-ink)] font-normal"
          }`}
        >
          <div>
            {renderFormattedBlocks(message.content, message.citations)}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-[var(--color-sage-leaf)] animate-pulse align-middle" />
            )}
          </div>
        </div>

        {/* Citations Footer Bar on Assistant Message */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-mist)]">
            <span className="text-[10px] font-mono text-[var(--color-sage-gray)] uppercase mr-1">
              Citations ({message.citations.length}):
            </span>
            {message.citations.map((cite) => (
              <button
                key={cite.index}
                onClick={() => onCitationClick(cite)}
                className="text-[11px] font-mono px-2.5 py-1 rounded-[var(--radius-tags)] bg-[var(--surface-bone)] hover:bg-[var(--color-eucalyptus)] border border-[var(--color-mist)] text-[var(--color-forest-ink)] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-[var(--color-sage-leaf)] font-semibold">
                  [{cite.index}]
                </span>
                <span className="truncate max-w-[180px]">
                  {cite.document_title} (p.{cite.page_number})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
