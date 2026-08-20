"use client";

import Link from "next/link";

interface HeaderProps {
  isHealthy?: boolean;
}

export function Header({ isHealthy }: HeaderProps) {
  return (
    <header className="w-full border-b border-[var(--color-mist)] bg-[var(--surface-linen)] sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Mark (Akkurat Sans) */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-sage-leaf)] group-hover:scale-110 transition-transform" />
          <span className="font-sans text-xl font-medium text-[var(--color-olive-press)] tracking-tight">
            Contexure
          </span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-tags)] bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)] font-mono border border-[var(--color-lichen)]">
            RAG-v0.1
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--color-sage-gray)]">
          <a
            href="#architecture"
            className="hover:text-[var(--color-forest-ink)] transition-colors"
          >
            Architecture
          </a>
          <a
            href="#datasheets"
            className="hover:text-[var(--color-forest-ink)] transition-colors"
          >
            Datasheets
          </a>
          <a
            href="#sandbox"
            className="hover:text-[var(--color-forest-ink)] transition-colors"
          >
            Live Probe
          </a>
          <a
            href="https://github.com/HOSEKI7/rag-ai-chatbot"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-forest-ink)] transition-colors"
          >
            GitHub ↗
          </a>
        </nav>

        {/* Live System Indicator & CTA */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--color-sage-gray)]">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy
                  ? "bg-[var(--color-sage-leaf)]"
                  : "bg-[var(--color-crimson-specimen)]"
              }`}
            />
            <span>{isHealthy ? "System Ready" : "Connecting..."}</span>
          </div>

          <Link
            href="/chat"
            className="px-4 py-2 rounded-[var(--radius-buttons)] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] text-xs font-mono font-medium hover:bg-[var(--color-olive-press)] transition-colors cursor-pointer"
          >
            Open Workspace →
          </Link>
        </div>
      </div>
    </header>
  );
}
