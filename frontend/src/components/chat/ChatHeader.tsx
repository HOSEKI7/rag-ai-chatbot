"use client";

import Link from "next/link";
import Image from "next/image";

interface ChatHeaderProps {
  onClear: () => void;
  onOpenCompare?: () => void;
  messageCount: number;
}

export function ChatHeader({
  onClear,
  onOpenCompare,
  messageCount,
}: ChatHeaderProps) {
  return (
    <header className="w-full border-b border-[var(--color-mist)] bg-[var(--surface-linen)] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Brand + Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-mono text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] transition-colors flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Landing</span>
          </Link>
          <div className="h-4 w-px bg-[var(--color-mist)]" />
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/contexure.webp"
              alt="Contexure Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-sans text-base font-medium text-[var(--color-olive-press)]">
              Contexure Workspace
            </span>
          </Link>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-tags)] bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)] hidden sm:inline-block">
            Dual-LLM RAG
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--color-sage-mist)] hidden sm:inline-block">
            {messageCount} {messageCount === 1 ? "turn" : "turns"}
          </span>
          {onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className="px-3 py-1.5 rounded-[var(--radius-buttons)] bg-[var(--surface-bone)] border border-[var(--color-mist)] text-[var(--color-forest-ink)] text-xs font-medium hover:border-[var(--color-forest-ink)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Compare Specs ⇄</span>
            </button>
          )}
          <button
            onClick={onClear}
            className="px-3.5 py-1.5 rounded-[var(--radius-buttons)] border border-[var(--color-lichen)] text-[var(--color-olive-press)] text-xs font-mono font-medium hover:bg-[var(--surface-bone)] hover:border-[var(--color-forest-ink)] transition-all cursor-pointer"
            aria-label="Clear chat history"
          >
            Clear Workspace
          </button>
        </div>
      </div>
    </header>
  );
}
