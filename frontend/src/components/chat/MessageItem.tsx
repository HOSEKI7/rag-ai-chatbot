"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChatMessage, CitationItem } from "@/types/chat";
import { downloadTechnicalReportPdf } from "@/lib/utils/pdfExport";

import { MarkdownRenderer } from "./MarkdownRenderer";

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
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <MarkdownRenderer
              content={message.content}
              citations={message.citations}
              onCitationClick={onCitationClick}
              isStreaming={message.isStreaming}
            />
          )}
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
