"use client";

import Link from "next/link";

export function AdminHeader() {
  return (
    <header className="w-full border-b border-[var(--color-mist)] bg-[var(--surface-linen)] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Brand + Section Link */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-mono text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] transition-colors flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Landing</span>
          </Link>
          <div className="h-4 w-px bg-[var(--color-mist)]" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-sage-leaf)]" />
            <span className="font-sans text-base font-medium text-[var(--color-olive-press)]">
              Contexure Admin Portal
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-tags)] bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)]">
              Operator Access
            </span>
          </div>
        </div>

        {/* Right: Quick Links */}
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="text-xs font-medium text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] underline underline-offset-4 hidden sm:inline-block"
          >
            Open Chat Workspace →
          </Link>
        </div>
      </div>
    </header>
  );
}
