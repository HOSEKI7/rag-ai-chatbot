"use client";

import React from "react";
import { ChatMessage, CitationItem } from "@/types/chat";

interface MessageItemProps {
  message: ChatMessage;
  onCitationClick: (citation: CitationItem) => void;
}

export function MessageItem({ message, onCitationClick }: MessageItemProps) {
  const isUser = message.role === "user";

  // Helper to render content with interactive clickable citation badges
  const renderMessageContent = (text: string, citations?: CitationItem[]) => {
    if (!text) return null;

    // Match patterns like [1], [2], [3]
    const regex = /\[(\d+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const citationNumber = parseInt(match[1], 10);

      // Push preceding plain text
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      // Find matching citation
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

  return (
    <div
      className={`w-full flex flex-col py-6 border-b border-[var(--color-mist)] ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div className="max-w-3xl w-full">
        {/* Author Label & Timestamp */}
        <div className="flex items-center gap-2 mb-2 text-xs font-mono">
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
          <div className="whitespace-pre-wrap">
            {renderMessageContent(message.content, message.citations)}
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
