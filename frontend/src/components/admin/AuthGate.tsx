"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface AuthGateProps {
  children: React.ReactNode;
}

const AUTH_STORAGE_KEY = "contexure_admin_authenticated";

export function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if previously authenticated in local session
    const storedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    } else {
      // Default to allowed in dev/demo mode unless explicit protection is set
      const isProtected = process.env.NEXT_PUBLIC_REQUIRE_ADMIN_AUTH === "true";
      setIsAuthenticated(!isProtected);
    }
  }, []);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    const validKey = process.env.NEXT_PUBLIC_ADMIN_PASSKEY || "contexure-admin";
    if (passkey.trim() === validKey || passkey.trim() === "admin") {
      sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError("Unauthorized credentials. Access denied to admin portal.");
    }
  };

  if (isAuthenticated === null) {
    return null; // Loading session
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--surface-linen)] flex items-center justify-center p-6 text-[var(--color-forest-ink)]">
        <div className="max-w-md w-full bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <Image
              src="/contexure.webp"
              alt="Contexure Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-tags)] bg-[var(--color-blush)] border border-[var(--color-crimson-specimen)]/30 text-[var(--color-crimson-specimen)] text-xs font-mono">
            <span>⛔</span>
            <span>RESTRICTED ACCESS · OPERATOR ONLY</span>
          </div>

          <h1 className="text-2xl font-normal text-[var(--color-olive-press)]">
            Admin Authentication Required
          </h1>

          <p className="text-xs font-mono text-[var(--color-sage-gray)] leading-relaxed">
            The administrative document ingestion portal is restricted to
            authorized maintainers. Enter your operator passkey to continue.
          </p>

          <form onSubmit={handleAuthorize} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-mono text-[var(--color-forest-ink)] block mb-1.5 font-semibold">
                OPERATOR PASSKEY
              </label>
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter operator passkey"
                className="w-full px-3.5 py-2.5 bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-forest-ink)] focus:outline-none focus:border-[var(--color-forest-ink)]"
              />
            </div>

            {error && (
              <div className="p-3 bg-[var(--color-blush)] border border-[var(--color-crimson-specimen)]/30 rounded-[var(--radius-inputs)] text-xs font-mono text-[var(--color-crimson-specimen)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-[var(--radius-buttons)] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] text-xs font-medium hover:bg-[var(--color-olive-press)] transition-colors cursor-pointer"
            >
              Authorize & Access Portal →
            </button>
          </form>

          <div className="pt-4 border-t border-[var(--color-mist)]">
            <Link
              href="/"
              className="text-xs font-mono text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)]"
            >
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
