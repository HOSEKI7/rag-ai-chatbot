"use client";

import React, { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl w-full mx-auto p-4 bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] relative focus-within:border-[var(--color-forest-ink)] transition-colors"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask technical specifications, wiring, tolerances..."
        className="w-full bg-transparent resize-none text-sm text-[var(--color-forest-ink)] placeholder-[var(--color-sage-mist)] font-mono focus:outline-none pr-24 py-1"
        disabled={isLoading}
      />

      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-mist)] text-[11px] font-mono text-[var(--color-sage-gray)]">
        <span>Press Enter ↵ to send · Shift+Enter for newline</span>

        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="px-4 py-1.5 rounded-[var(--radius-buttons)] bg-[var(--color-crimson-specimen)] text-[var(--surface-linen)] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
          >
            <span className="w-2 h-2 rounded-xs bg-[var(--surface-linen)]" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-1.5 rounded-[var(--radius-buttons)] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] font-medium hover:bg-[var(--color-olive-press)] transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="Send message"
          >
            Send ↵
          </button>
        )}
      </div>
    </form>
  );
}
