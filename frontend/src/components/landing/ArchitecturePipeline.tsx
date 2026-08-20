"use client";

import { useState } from "react";

interface PipelineStep {
  id: string;
  stepNumber: string;
  title: string;
  category: string;
  summary: string;
  details: string[];
  codeSample: string;
  badgeToken: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "parser",
    stepNumber: "STAGE 01",
    title: "Docling Layout Parser",
    category: "Ingestion Engine",
    summary:
      "Extracts complex industrial datasheet layouts, multi-column tables, electrical ratings, and section hierarchies into clean structured markdown.",
    details: [
      "Table-aware extraction preserving cell row/column coordinates",
      "Hierarchical heading detection (# H1, ## H2, ### H3)",
      "Page number mapping for verifiable footnote citation grounding",
    ],
    codeSample: `# Parsed Table Output (Docling)
| Parameter | Rating | Unit |
|---|---|---|
| Rated Output | 15.0 | kW |
| Efficiency Class | IE3 | Premium |
| Operating Voltage | 400 | V (50Hz) |`,
    badgeToken: "bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)]",
  },
  {
    id: "chunker",
    stepNumber: "STAGE 02",
    title: "Hierarchical Parent-Child Chunking",
    category: "Semantic Segmentation",
    summary:
      "Segments documents along structural boundaries into Parent Chunks (~1,200 tokens) for generation context and dense Child Chunks (~300 tokens) for retrieval.",
    details: [
      "Parent Chunks preserve holistic section context and complete tables",
      "Child Chunks receive contextual prefixes [Document > Section]",
      "Zero fragmentation on consecutive structural headings",
    ],
    codeSample: `# Child Chunk Payload
{
  "id": "doc-siemens-p001-c001",
  "parent_id": "doc-siemens-p001",
  "text": "[Siemens 1LE1 > Specs]\\nRated power 15 kW...",
  "page_number": 2,
  "is_table": true
}`,
    badgeToken: "bg-[var(--color-blush)] text-[var(--color-crimson-specimen)]",
  },
  {
    id: "embedder",
    stepNumber: "STAGE 03",
    title: "Local 768-dim FastEmbed",
    category: "ONNX Runtime on CPU",
    summary:
      "Generates normalized 768-dimensional vector embeddings on CPU using nomic-embed-text-v1.5 with zero external API calls or latency spikes.",
    details: [
      "8,192 token context window embedding model",
      "search_document: and search_query: task-specific prefixes",
      "100% private, self-contained ONNX execution in Docker container",
    ],
    codeSample: `# Vector Generation
vector = embedder.embed_query("What is the motor rated torque?")
# Result: [0.0342, -0.0129, 0.0871, ... 768 floats]
# Storage: Qdrant Cloud Cosine Collection`,
    badgeToken: "bg-[var(--color-eucalyptus)] text-[var(--color-deep-teal)]",
  },
  {
    id: "reranker",
    stepNumber: "STAGE 04",
    title: "FlashRank Cross-Encoder & Guardrail",
    category: "Precision Reranking & Safety",
    summary:
      "Prunes top-20 vector candidates to top-5 using FlashRank cross-encoder, evaluating confidence against a strict θ ≥ 0.65 threshold to stop hallucinations.",
    details: [
      "ms-marco-TinyBERT cross-encoder joint scoring (query + passage)",
      "Sigmoid calibrated confidence scores in [0.0, 1.0]",
      "Deterministic out-of-scope refusal without invoking LLMs",
    ],
    codeSample: `# Guardrail Decision Logic
if top_score < 0.65:
    return RefusalResponse("Query out of verified datasheet scope.")
else:
    context = reconstruct_deduplicated_parents(top_5_chunks)`,
    badgeToken: "bg-[var(--surface-bone)] text-[var(--color-amber-pin)]",
  },
  {
    id: "generator",
    stepNumber: "STAGE 05",
    title: "Dual-Provider SSE Generation",
    category: "Grounded Synthesis",
    summary:
      "Streams answers with inline footnote citations [1], [2] using Google Gemini 2.5 Flash as primary, with automatic failover to Groq Llama 3.3 70B.",
    details: [
      "Strict grounding prompt: forbids unverified assertions",
      "Dynamic language matching (Indonesian / English / German)",
      "Real-time Server-Sent Events (SSE) streaming with citation cards",
    ],
    codeSample: `# SSE Stream Output
data: {"type": "metadata", "citations": [...], "score": 0.89}
data: {"type": "token", "content": "The Siemens 1LE1 delivers 15 kW [1]..."}
data: {"type": "done", "provider": "gemini", "latency_ms": 340}`,
    badgeToken: "bg-[var(--color-eucalyptus)] text-[var(--color-olive-press)]",
  },
];

export function ArchitecturePipeline() {
  const [activeStep, setActiveStep] = useState<PipelineStep>(PIPELINE_STEPS[0]);

  return (
    <section
      id="architecture"
      className="py-20 md:py-28 border-b border-[var(--color-mist)]"
    >
      {/* Section Header */}
      <div className="mb-12">
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-2">
          SYSTEM ARCHITECTURE & RAG PIPELINE
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-[var(--color-olive-press)] tracking-tight">
          How Contexure guarantees deterministic accuracy.
        </h2>
      </div>

      {/* Stage Navigation Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-8">
        {PIPELINE_STEPS.map((step) => {
          const isActive = step.id === activeStep.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step)}
              className={`p-3 rounded-[var(--radius-cards)] border text-left transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--color-forest-ink)] text-[var(--surface-linen)] border-[var(--color-forest-ink)] shadow-sm"
                  : "bg-[var(--surface-bone)] text-[var(--color-olive-press)] border-[var(--color-mist)] hover:border-[var(--color-lichen)]"
              }`}
            >
              <span
                className={`text-[10px] font-mono block mb-1 ${
                  isActive
                    ? "text-[var(--color-eucalyptus)]"
                    : "text-[var(--color-sage-leaf)]"
                }`}
              >
                {step.stepNumber}
              </span>
              <span className="text-xs font-medium block leading-tight line-clamp-1">
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Step Specimen Display Card */}
      <div className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Explanatory Copy & Details */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono text-[var(--color-sage-leaf)] uppercase">
                {activeStep.stepNumber} // {activeStep.category}
              </span>
            </div>

            <h3 className="text-2xl font-normal text-[var(--color-olive-press)] mb-4">
              {activeStep.title}
            </h3>

            <p className="text-sm text-[var(--color-sage-gray)] leading-relaxed mb-6">
              {activeStep.summary}
            </p>

            <div className="space-y-2.5 mb-6">
              {activeStep.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs font-mono text-[var(--color-forest-ink)]"
                >
                  <span className="text-[var(--color-sage-leaf)] font-bold">
                    ✓
                  </span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-mist)] flex items-center justify-between text-xs font-mono text-[var(--color-sage-mist)]">
            <span>Zero-Cost Infrastructure Stack</span>
            <span>100% Verifiable Citations</span>
          </div>
        </div>

        {/* Right Column: Code / Data Payload Specimen */}
        <div className="lg:col-span-5 bg-[var(--surface-linen)] border border-[var(--color-mist)] rounded-[var(--radius-inputs)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--color-mist)] text-[10px] font-mono text-[var(--color-sage-gray)]">
              <span>DATA SPECIMEN</span>
              <span className="uppercase">{activeStep.id}.json</span>
            </div>
            <pre className="text-xs font-mono text-[var(--color-forest-ink)] whitespace-pre-wrap overflow-x-auto leading-relaxed">
              {activeStep.codeSample}
            </pre>
          </div>

          <div className="mt-4 pt-2 border-t border-[var(--color-mist)] text-[10px] font-mono text-[var(--color-sage-leaf)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-sage-leaf)]" />
            <span>Active Pipeline Stage Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
}
