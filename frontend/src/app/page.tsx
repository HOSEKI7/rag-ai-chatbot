'use client'

import { useEffect, useState } from 'react'
import { checkBackendHealth, HealthCheckResult } from '@/lib/api/health'

export default function HomePage() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const probeBackend = async () => {
    setLoading(true)
    const result = await checkBackendHealth()
    setHealth(result)
    setLoading(false)
  }

  useEffect(() => {
    probeBackend()
  }, [])

  return (
    <main className="min-h-screen px-6 py-16 max-w-[1200px] mx-auto flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-mist)] pb-6 mb-12">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[var(--color-sage-leaf)]" />
          <h1 className="text-xl font-medium tracking-tight text-[var(--color-forest-ink)]">
            Contexure
          </h1>
          <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-eucalyptus)] text-[var(--color-olive-press)] font-mono">
            RAG AI Engine
          </span>
        </div>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <a
            href="https://github.com/HOSEKI7/rag-ai-chatbot"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-sage-gray)] hover:text-[var(--color-forest-ink)] transition-colors"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Main Status Probe Card (Adaline Specimen Card) */}
      <section className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-xl bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[10px] p-8">
          {/* Specimen Badge */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)]">
              SYSTEM ARCHITECTURE STATUS
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium ${
                health?.isHealthy
                  ? 'bg-[#dcfce7] text-[#15803d]'
                  : 'bg-[#fee2e2] text-[#b91c1c]'
              }`}
            >
              {loading
                ? 'PROBING...'
                : health?.isHealthy
                ? 'ONLINE & HEALTHY'
                : 'DISCONNECTED'}
            </span>
          </div>

          <h2 className="text-2xl font-normal text-[var(--color-olive-press)] mb-2">
            Two-Tier RAG Scaffold
          </h2>
          <p className="text-sm text-[var(--color-sage-gray)] leading-relaxed mb-6">
            Next.js App Router frontend connected to Python FastAPI RAG backend with local embeddings and vector retrieval.
          </p>

          {/* Diagnostic Details */}
          <div className="bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-[6px] p-4 text-xs font-mono space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-[var(--color-sage-gray)]">Frontend:</span>
              <span className="text-[var(--color-forest-ink)]">Next.js (Ready)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-sage-gray)]">Backend Service:</span>
              <span className="text-[var(--color-forest-ink)]">
                {health?.data?.service || 'contexure-backend (Awaiting Start)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-sage-gray)]">Version:</span>
              <span className="text-[var(--color-forest-ink)]">
                {health?.data?.version || '0.1.0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-sage-gray)]">API Status:</span>
              <span
                className={
                  health?.isHealthy
                    ? 'text-[#15803d] font-semibold'
                    : 'text-[var(--color-crimson-specimen)]'
                }
              >
                {health?.data?.connectivity?.api || health?.error || 'Standby'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={probeBackend}
              disabled={loading}
              className="px-5 py-2.5 rounded-[20px] bg-[var(--color-forest-ink)] text-[var(--surface-linen)] text-sm font-medium hover:bg-[var(--color-olive-press)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Testing...' : 'Re-probe Backend'}
            </button>
            <a
              href="http://localhost:8000/api/v1/docs"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-[20px] border border-[var(--color-lichen)] text-[var(--color-olive-press)] text-sm font-medium hover:border-[var(--color-forest-ink)] transition-colors"
            >
              Swagger Docs ↗
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-mist)] pt-6 mt-12 flex justify-between items-center text-xs font-mono text-[var(--color-sage-mist)]">
        <span>Contexure © 2026</span>
        <span>Adaline Design System · Single-Context RAG</span>
      </footer>
    </main>
  )
}
