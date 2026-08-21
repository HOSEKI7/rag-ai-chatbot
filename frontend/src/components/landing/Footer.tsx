import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full bg-[var(--color-slate-hollow)] text-[var(--surface-linen)] mt-24">
      <div className="max-w-[1200px] mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[var(--color-sage-gray)]/20">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/contexure.webp"
                alt="Contexure Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="font-sans text-2xl font-medium tracking-tight text-[var(--surface-linen)]">
                Contexure
              </span>
            </div>
            <p className="text-xs text-[var(--color-eucalyptus)] leading-relaxed max-w-sm font-mono mb-4">
              Deterministic RAG intelligence & datasheet query engine for
              industrial equipment with verifiable footnote citations.
            </p>
            <span className="text-[11px] font-mono text-[var(--color-sage-mist)] block">
              Adaline Design System · Single-Context RAG
            </span>
          </div>

          {/* Col 2: Pipeline Architecture */}
          <div className="md:col-span-3">
            <span className="text-xs font-mono uppercase text-[var(--color-eucalyptus)] block mb-4">
              PIPELINE SEAMS
            </span>
            <ul className="space-y-2 text-xs font-mono text-[var(--color-sage-mist)]">
              <li>Docling Layout Parser</li>
              <li>Hierarchical Parent-Child Chunks</li>
              <li>768-dim FastEmbed ONNX</li>
              <li>FlashRank Cross-Encoder Gate</li>
              <li>Gemini / Groq Failover SSE</li>
            </ul>
          </div>

          {/* Col 3: Resources & Links */}
          <div className="md:col-span-4">
            <span className="text-xs font-mono uppercase text-[var(--color-eucalyptus)] block mb-4">
              SPECIFICATIONS & REPO
            </span>
            <ul className="space-y-2 text-xs font-mono text-[var(--color-eucalyptus)]">
              <li>
                <a
                  href="https://github.com/HOSEKI7/rag-ai-chatbot"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  GitHub Repository ↗
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/api/v1/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  FastAPI OpenAPI Swagger ↗
                </a>
              </li>
              <li>
                <Link href="/chat" className="hover:underline">
                  Chat Workspace →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[var(--color-sage-mist)] gap-4">
          <span>Contexure © 2026 · Licensed under MIT</span>
          <span>Zero-Cost Infrastructure · Hugging Face Spaces</span>
        </div>
      </div>
    </footer>
  );
}
