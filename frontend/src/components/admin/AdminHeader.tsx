"use client";

import Link from "next/link";
import Image from "next/image";

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
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/contexure.webp"
              alt="Contexure Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-sans text-base font-medium text-[var(--color-olive-press)]">
              Contexure Admin Portal
            </span>
          </Link>
        </div>

        {/* Right: Quick Links */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link
            href="/admin"
            className="text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] transition-colors"
          >
            Documents
          </Link>
          <Link
            href="/admin/observability"
            className="text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] transition-colors"
          >
            Observability
          </Link>
          <div className="h-4 w-px bg-[var(--color-mist)]" />
          <Link
            href="/chat"
            className="text-[var(--color-olive-press)] hover:text-[var(--color-forest-ink)] underline underline-offset-4 hidden sm:inline-block"
          >
            Open Chat Workspace →
          </Link>
        </div>
      </div>
    </header>
  );
}
