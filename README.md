# Contexure ⚡

### Enterprise AI Technical Support & Product Knowledge Platform for Industrial Equipment Datasheets

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue?style=flat-square&logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Qdrant](https://img.shields.io/badge/Vector_DB-Qdrant_Cloud-red?style=flat-square&logo=qdrant)](https://qdrant.tech/)
[![FastEmbed](https://img.shields.io/badge/Embeddings-nomic--embed--text--v1.5-blueviolet?style=flat-square)](https://github.com/qdrant/fastembed)
[![FlashRank](https://img.shields.io/badge/Reranker-FlashRank_Cross--Encoder-orange?style=flat-square)](https://github.com/PrithivirajDamodaran/FlashRank)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Primary_LLM-Google_Gemini_2.5_Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Groq Llama 3.3](https://img.shields.io/badge/Fallback_LLM-Groq_Llama_3.3_70B-F55036?style=flat-square)](https://groq.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 📖 Executive Summary

**Contexure** is an enterprise-grade, retrieval-augmented generation (RAG) conversational platform purpose-built for industrial automation engineers, field technicians, and system integrators who interact with complex technical datasheets (AC motors, variable frequency drives, PLCs, inductive sensors).

Industrial equipment documentation is notoriously dense, filled with multi-column rating tables, pinout schematics, and strict operating tolerances. Generic LLM solutions frequently hallucinate critical parameters (such as torque limits, voltage ratings, or bus protocols), leading to catastrophic machinery failures or incorrect field wiring.

**Contexure solves this through a rigorous 5-stage RAG architecture:**

1. **Structure-Aware Document Ingestion:** Preserves hierarchical section trees and markdown tables without layout collapse.
2. **Local CPU Embedding Engine:** Generates normalized 768-dimensional embeddings using `nomic-embed-text-v1.5` via FastEmbed with zero external API latency or billing.
3. **FlashRank Cross-Encoder Reranker & Confidence Guardrail:** Performs deep semantic relevance scoring with `ms-marco-TinyBERT-L-2-v2`. Any query scoring below a calibrated confidence threshold ($\theta < 0.65$) triggers an immediate, deterministic out-of-scope refusal without incurring LLM generation costs.
4. **Resilient Dual-LLM Generation:** Primary synthesis with **Google Gemini 2.5 Flash** backed by automatic, zero-downtime failover to **Groq Llama 3.3 70B** upon rate limits (HTTP 429) or transient errors (HTTP 5xx).
5. **Adaline Editorial Design System:** A calm, botanical, flat-elevation aesthetic (Linen canvas, Bone cards, Forest Ink typography, 1px Mist borders, Fragment Mono metadata tags) tailored for long analytical sessions.

---

## 🏛️ System Architecture

```
                               ┌──────────────────────────────────────────────────────────┐
                               │                    CONTEXURE CLIENT                      │
                               │  - Editorial Landing Page & 5-Stage Visualizer           │
                               │  - Real-Time Chat Workspace (SSE + Clickable Citations)  │
                               │  - Multi-Document Specification Comparison Modal         │
                               │  - Single-Answer PDF Technical Report Export (jsPDF)     │
                               │  - Ingestion Portal (Drag & Drop + Progress Stepper)     │
                               │  - Observability Dashboard (KPIs, Histograms, Traces)    │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                                         HTTP / SSE Streams (Port 3000 -> 8000)
                                                            │
                               ┌────────────────────────────▼─────────────────────────────┐
                               │                  FASTAPI BACKEND ENGINE                  │
                               │                                                          │
                               │  [ 1. Ingestion Subsystem ]                              │
                               │    PyMuPDF / Docling ──► Hierarchical Parent-Child       │
                               │    ──► FastEmbed nomic-embed-text-v1.5 (Local CPU)       │
                               │    ──► Qdrant Cloud Vector Store Upsert                  │
                               │                                                          │
                               │  [ 2. Hybrid Retrieval & Guardrail Pipeline ]            │
                               │    Vector Cosine Search (Top-20)                         │
                               │    ──► FlashRank Cross-Encoder Scoring (Top-5)           │
                               │    ──► Confidence Guardrail Gate (Score >= 0.65)         │
                               │    ──► Parent Context Reconstruction                     │
                               │                                                          │
                               │  [ 3. Resilient Multi-Provider LLM Synthesis ]           │
                               │    Grounded XML Prompt Builder                           │
                               │    ──► Primary: Google Gemini 2.5 Flash                  │
                               │    ──► Automatic Failover: Groq Llama 3.3 70B Versatile  │
                               │    ──► Streaming SSE Token Emitter                       │
                               │                                                          │
                               │  [ 4. Observability & Telemetry ]                        │
                               │    Thread-Safe Trace Logger & Analytics Aggregator       │
                               └──────────────────────────────────────────────────────────┘
```

---

## ✨ Key Platform Features

### 1. 💬 Interactive Chat Workspace with Grounded Citations (`/chat`)

- **Real-Time Token Streaming:** Server-Sent Events (SSE) stream synthesized tokens directly into the chat thread with minimal Time-To-First-Token (TTFT).
- **Interactive Clickable Citations:** Footnote badges (e.g. `[1]`, `[2]`) trigger a slide-out drawer displaying the originating datasheet title, section hierarchy, page number, confidence score, and extracted verbatim text snippet.
- **Client-Side Session Memory:** Full thread persistence stored in `localStorage` across page reloads with one-click workspace wipe.
- **Guardrail Refusal Alert:** Queries that cannot be verified against indexed documents trigger a styled refusal banner explaining why the query was rejected.

### 2. ⚖️ Multi-Document Specification Comparison Matrix

- **Comparative RAG Pipeline:** Accessible via natural language (e.g., _"Compare Siemens 1LE1 motor with ABB ACS580 drive"_) or via the dedicated **Compare Specs ⇄** modal.
- **Balanced Vector Retrieval:** Queries chunks for each compared specimen independently to prevent one document from dominating the context window.
- **Responsive Markdown Table Rendering:** Generates side-by-side comparison matrices with horizontal scrolling, comparing rated power, operating voltage, efficiency classes, IP ratings, and bus protocols.

### 3. 📄 Client-Side Single-Answer PDF Technical Report Export

- **One-Click Export Action:** Any verified assistant response can be downloaded as a PDF technical report via `jsPDF`.
- **Zero-Latency Generation:** Entire PDF is compiled locally in the browser with no server rendering overhead.
- **Adaline Branded Layout:** Features formal document headers, verification status box, UTC timestamp, confidence score rating, question summary, sanitized answer body, and a structured 3-column citation footnotes table.

### 4. 📥 Datasheet Ingestion & Vector Management Portal (`/admin`)

- **Drag-and-Drop Ingestion:** Upload industrial PDF datasheets with real-time multi-stage progress tracking (_Uploading → Parsing Markdown → Generating Embeddings → Storing Vectors_).
- **Active Document Catalog:** View all indexed equipment datasheets, category tags, page counts, chunk distributions, and upload timestamps.
- **Vector Purging:** Delete any document from Qdrant Cloud and local registries with immediate consistency.
- **Operator Access Control:** Secured with `AuthGate` operator verification.

### 5. 📊 Observability & RAG Analytics Dashboard (`/admin/observability`)

- **System KPIs:** Query volume, Guardrail Pass Rate %, Average Confidence Score %, and latency breakdown (Retrieval vs. Generation).
- **Provider Telemetry Widget:** Real-time ratio of Gemini 2.5 Flash vs. Groq Llama 3.3 Fallback invocations with per-provider average latency.
- **Confidence Score Distribution Histogram:** Visual buckets (`< 0.65 Refusal`, `0.65-0.75 Moderate`, `0.75-0.85 High`, `> 0.85 Very High`).
- **Most-Retrieved Datasheets Leaderboard:** Identifies which datasheets are accessed most frequently.
- **Knowledge Gap Triage Table:** Logs rejected/unanswered queries so AI engineers can identify missing documentation.
- **Live Trace Stream:** Full query telemetry log with timestamps, latency metrics, and guardrail decisions.

---

## 🎨 Adaline Design System

Contexure adheres strictly to the **Adaline Design System** specifications (`DESIGN.md`):

| Token Name           | Hex Code  | Usage                                           |
| -------------------- | --------- | ----------------------------------------------- |
| **Linen**            | `#f8f9f5` | Page background / canvas                        |
| **Bone**             | `#eff2e8` | Card surfaces, modals, table headers            |
| **Forest Ink**       | `#0a1d08` | Primary text, titles, dark CTA buttons          |
| **Olive Press**      | `#2b390a` | Subheadings, section titles, secondary text     |
| **Sage Leaf**        | `#4a6d47` | Accent badges, category tags, active states     |
| **Eucalyptus**       | `#c9d5c5` | Citation badge background, pill tags            |
| **Lichen**           | `#c5ccb6` | Ghost button borders, dividers                  |
| **Mist**             | `#e1e6df` | 1px border lines, structural rules              |
| **Slate Hollow**     | `#2a332a` | Deep contrast footer background                 |
| **Crimson Specimen** | `#991e4b` | Guardrail refusal alert banners, knowledge gaps |

- **Typography Rules:**
  - **Newsreader (Display Serif):** Strictly reserved for the single hero headline on the landing page.
  - **Akkurat (Sans-Serif):** All headings, subheadings, navigation labels, dropdowns, and running copy.
  - **Fragment Mono (Monospace):** Badges, citations `[1]`, uppercase tags (`tracking-[0.04em]`), code, and telemetry IDs.
- **Elevation:** Flat elevation with `1px border-[var(--color-mist)]`. Zero drop shadows (`shadow-sm`, `shadow-md` are strictly forbidden).

---

## 🛠️ Technology Stack

### Backend Subsystem

- **Runtime:** Python 3.11+ (FastAPI, Uvicorn, Pydantic v2, Asyncio, AnyIO)
- **Document Parsing:** PyMuPDF (`fitz`), Docling structural layout engine
- **Embeddings:** FastEmbed ONNX runtime (`nomic-embed-text-v1.5`, 768-dim, normalized Cosine)
- **Vector Database:** Qdrant Cloud (Managed REST/gRPC API) & In-Memory fallback for unit testing
- **Reranker:** FlashRank Cross-Encoder (`ms-marco-TinyBERT-L-2-v2`)
- **LLM Primary:** Google Gemini 2.5 Flash via `google-genai` SDK
- **LLM Fallback:** Groq Llama 3.3 70B Versatile via `groq` SDK
- **Testing:** Pytest, pytest-asyncio, HTTPX TestClient

### Frontend Subsystem

- **Framework:** Next.js 16.3.1 (React 19, Turbopack, App Router)
- **Language:** TypeScript 5.0+ (Strict mode)
- **Styling:** Tailwind CSS v4 + Custom Adaline CSS Design Variables
- **PDF Generation:** `jsPDF` client-side report generator
- **Icons:** Minimal 1px-stroked SVG icons in Sage Gray (Zero external bloated icon libraries)
- **Testing:** Vitest 4.1, Testing Library (React & Jest-DOM), jsdom

---

## 🚀 Quickstart & Installation Guide

Follow these steps to run the entire Contexure application locally from scratch.

### 📋 Prerequisites

Ensure you have the following installed:

1. **Node.js 20+** and **pnpm** (`npm install -g pnpm`)
2. **Python 3.11+**
3. **Git**
4. _(Optional but recommended)_ Free API Keys:
   - **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))
   - **Groq API Key** ([Groq Console](https://console.groq.com/))
   - **Qdrant Cloud URL & API Key** ([Qdrant Cloud Free Tier](https://cloud.qdrant.io/)) _(If omitted, backend defaults to local in-memory storage)_

---

### Step 1: Clone Repository

```bash
git clone https://github.com/HOSEKI7/rag-ai-chatbot.git
cd rag-ai-chatbot
```

---

### Step 2: Configure & Run Backend (FastAPI)

1. Open a terminal and navigate to `backend/`:

   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:

   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:

   ```bash
   # Windows:
   copy .env.example .env

   # Linux / macOS:
   cp .env.example .env
   ```

5. Edit `backend/.env` with your API keys:

   ```env
   ENVIRONMENT="development"
   SERVICE_NAME="contexure-backend"
   BACKEND_CORS_ORIGINS='["http://localhost:3000","http://127.0.0.1:3000"]'

   # LLM Providers (Optional for local testing; simulated fallback active if blank)
   GEMINI_API_KEY="your-gemini-api-key"
   GROQ_API_KEY="your-groq-api-key"

   # Vector Store (Leave blank for in-memory testing or add Qdrant Cloud credentials)
   QDRANT_URL="https://your-qdrant-cluster.qdrant.tech:6333"
   QDRANT_API_KEY="your-qdrant-api-key"
   QDRANT_COLLECTION="industrial_datasheets"

   # RAG Pipeline Thresholds
   CONFIDENCE_THRESHOLD=0.65
   TOP_K_RETRIEVAL=20
   TOP_K_RERANK=5
   ```

6. Start the FastAPI backend server:

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   - **Backend API Base URL:** `http://localhost:8000`
   - **Interactive OpenAPI Docs:** `http://localhost:8000/api/v1/docs`
   - **Health Check Probe:** `http://localhost:8000/api/v1/health`

---

### Step 3: Configure & Run Frontend (Next.js)

1. Open a second terminal and navigate to the project root:

   ```bash
   cd frontend
   ```

2. Install frontend dependencies:

   ```bash
   pnpm install
   ```

3. Configure frontend environment variables:

   ```bash
   # Windows:
   copy .env.example .env.local

   # Linux / macOS:
   cp .env.example .env.local
   ```

4. Verify `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_APP_NAME="Contexure"
   NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
   ```

5. Start the Next.js development server:

   ```bash
   pnpm dev
   ```

6. Open your browser and access the platform:
   - 🌐 **Editorial Landing Page:** `http://localhost:3000`
   - 💬 **Interactive Chat Workspace:** `http://localhost:3000/chat`
   - 📄 **Datasheets Catalog:** `http://localhost:3000/datasheets`
   - 📥 **Document Ingestion Portal:** `http://localhost:3000/admin`
   - 📊 **Observability & Analytics:** `http://localhost:3000/admin/observability`

---

## 🧪 Verification & Testing Suite

Both backend and frontend are protected by automated unit and integration tests.

### Running Backend Tests (`pytest`)

```bash
# From repository root:
$env:PYTHONPATH="backend"; backend\venv\Scripts\pytest backend/tests -v

# Or from backend/ directory:
cd backend
pytest tests -v
```

**Result:** `25 passed in ~4-7s` covering:

- `test_analytics.py`: Telemetry recording, trace ring buffers, and metric aggregation.
- `test_chat_api.py`: SSE streaming, metadata emission, and guardrail refusal events.
- `test_chunker.py`: Structure-aware parent-child chunk boundaries and table preservation.
- `test_compare.py`: Multi-document balanced retrieval and comparative prompt synthesis.
- `test_embedding.py`: FastEmbed 768-dim local vector generation.
- `test_health.py`: FastAPI health probe connectivity.
- `test_ingest_api.py`: PDF multipart upload and Qdrant point upsertion.
- `test_llm_provider.py`: Gemini primary generation and automatic Groq failover.
- `test_prompt_builder.py`: Strict citation token enforcement and multilingual query matching.
- `test_reranker.py`: FlashRank cross-encoder ranking.
- `test_retrieval_pipeline.py`: Confidence threshold guardrail gating ($\theta \ge 0.65$).
- `test_vector_store.py`: Qdrant collection lifecycle, scrolling, and point deletions.

---

### Running Frontend Tests (`Vitest`)

```bash
# From repository root:
pnpm run test

# Or specifically frontend:
pnpm --filter frontend test
```

**Result:** `19 passed in ~2s` covering:

- `PdfExport.test.tsx`: jsPDF report formatting, metadata mapping, and download triggers.
- `CompareModal.test.tsx`: Multi-document dropdown selectors and comparative query generation.
- `Observability.test.tsx`: Telemetry KPI metrics, provider ratio bars, and trace tables.
- `AdminPortal.test.tsx`: Drag-and-drop dropzone, upload progress stepper, and document purging.
- `ChatWorkspace.test.tsx`: Message thread view, citation drawers, and stream handling.
- `LandingPage.test.tsx`: 5-stage architecture preview and interactive query sandbox.
- `Header.test.tsx`: Brand navigation and workspace routing.

---

### Full Monorepo Typecheck & Production Build

```bash
# Run TypeScript compiler check
pnpm run typecheck

# Run production build
pnpm --filter frontend build
```

---

## 📡 REST & SSE API Reference

| Method   | Endpoint                 | Description                                 | Payload / Query                                  |
| -------- | ------------------------ | ------------------------------------------- | ------------------------------------------------ |
| `GET`    | `/api/v1/health`         | Service health probe & metadata             | None                                             |
| `POST`   | `/api/v1/ingest`         | Multipart PDF datasheet ingestion           | `file: UploadFile`, `document_title`, `category` |
| `GET`    | `/api/v1/documents`      | List all indexed source documents           | None                                             |
| `DELETE` | `/api/v1/documents/{id}` | Purge all document vectors from Qdrant      | `document_id: str`                               |
| `POST`   | `/api/v1/retrieve`       | Semantic search with FlashRank reranking    | `{"query": str, "limit": int}`                   |
| `POST`   | `/api/v1/chat`           | Real-time SSE streaming chat with citations | `{"query": str, "filter_doc_ids": []}`           |
| `POST`   | `/api/v1/compare`        | Multi-document comparative synthesis        | `{"doc_ids": ["doc_1", "doc_2"], "query": str}`  |
| `GET`    | `/api/v1/analytics`      | Aggregated RAG observability metrics        | None                                             |

---

## 🚢 Deployment Architecture

### Backend: Hugging Face Spaces (Docker)

The backend includes a pre-configured `backend/Dockerfile` compliant with Hugging Face Spaces CPU Basic (16GB RAM):

- Installs Python 3.11 slim image.
- Exposes port `7860`.
- Downloads FastEmbed ONNX models during container warmup to ensure zero cold-start latency during inference.

### Frontend: Vercel

The frontend is built on Next.js 16 App Router and can be deployed to Vercel with zero configuration:

- Set `NEXT_PUBLIC_BACKEND_URL` to your Hugging Face Space URL (e.g. `https://your-space.hf.space`).
- Vercel Edge proxies `/api/chat` SSE streams with full chunk buffering disablement (`X-Accel-Buffering: no`).

---

## 👥 Contributing & Working Agreements

- **Language Policy:** All shipped code, commit messages, identifiers, and documentation are strictly in **English**. Discussions and planning with repository owners are conducted in **Bahasa Indonesia**.
- **Code Standards:** Strictly zero unused dead code, surgical modifications, and pre-commit formatting via Husky + lint-staged + Prettier.
- **Testing Standard:** Every new feature or bugfix must pass TDD verification (`pytest` for backend, `vitest` for frontend).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Built with passion for industrial automation and reliable, hallucination-free AI engineering.
