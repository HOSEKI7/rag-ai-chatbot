# Contexure: AI Technical Support & Product Knowledge Chatbot Specification

## Problem Statement

Engineers, procurement teams, and field technicians working with industrial equipment (motors, sensors, PLCs, automation drives) spend significant time manually searching through dense, multi-page technical datasheets and specification sheets to find critical parameters, wiring diagrams, torque limits, and compatibility data. Existing generic AI chatbots frequently hallucinate non-existent technical specifications, cannot cite exact datasheet passages, fail to parse complex specification tables accurately, and answer out-of-scope queries that could lead to costly or dangerous industrial misconfigurations.

Additionally, technical hiring managers and recruitment teams evaluating AI & Software Engineering candidates often encounter generic toy projects (simple API wrappers or cookie-cutter chatbots) that fail to demonstrate production-grade AI engineering depth, such as structure-aware parsing, hierarchical chunking, local embedding pipelines, vector database orchestration, reranking, and guardrail enforcement.

## Solution

**Contexure** is a production-grade, domain-specific AI Technical Support and Product Knowledge Chatbot built for industrial equipment documentation. It allows users to ask natural-language questions across multiple manufacturer datasheets and receive precise, streaming, multi-lingual answers strictly grounded in verified technical documentation.

Every answer includes footnote-style citations referencing exact document names, sections, and expandable source text snippets. If a query falls outside the knowledge base or fails retrieval confidence thresholds, the system strictly refuses to answer rather than risking hallucination. The application also provides multi-document specification comparisons, single-answer PDF reporting for field reference, an admin dashboard protected by GitHub OAuth for document ingestion and RAG observability analytics, and an editorial design system tailored for industrial technology.

---

## User Stories

### End-User Q&A & Search
1. As an industrial engineer, I want to ask natural-language questions about product specifications (e.g., motor torque, sensor voltage ranges, PLC pinouts), so that I can quickly find technical parameters without manually scanning 50-page PDFs.
2. As a field technician, I want answers to be delivered via real-time token streaming, so that I don't have to wait for the entire response to generate before reading the initial facts.
3. As a global user, I want to ask questions in my native language (e.g., Indonesian, English, German) and receive accurate answers in that same language, so that language barriers do not hinder technical support.
4. As a quality assurance engineer, I want every generated answer to include footnote-style citations with expandable source snippets, so that I can independently verify the veracity of the AI's claims against the original datasheet.
5. As an engineer reviewing a citation, I want to click on a cited source document to view/preview the exact PDF in the browser, so that I have immediate access to surrounding diagrams and full context.
6. As a user asking an out-of-scope or unverified question, I want the bot to explicitly state that the information is unavailable in the knowledge base, so that I am never misled by AI hallucinations on mission-critical equipment.
7. As a prospective employer or first-time visitor, I want to see clickable suggested example questions on an empty chat state, so that I can immediately test representative queries without having to guess what documents are indexed.
8. As a user engaged in troubleshooting, I want the bot to remember previous turns in our conversation session, so that I can ask follow-up questions using pronouns and relative references (e.g., "What about its operating temperature?") without repeating prior context.
9. As a privacy-conscious user, I want my public conversation history stored locally on my device (localStorage), so that my session is private and requires no friction-heavy account registration.
10. As a user who wants to reset a session, I want a single-click action to clear my current chat history, so that I can start an unrelated inquiry with a fresh context.

### Document Comparison & Reporting
11. As a procurement specialist, I want to ask the bot in natural language to compare two or more indexed products (e.g., "Compare Siemens 1LE1 motor with ABB M3BP motor"), so that I receive a structured, side-by-side comparison table of key specifications.
12. As a system integrator, I want an explicit UI comparison tool where I can select two indexed datasheets from dropdowns and click "Compare", so that I can instantly view a generated comparison without crafting a detailed prompt.
13. As a field engineer submitting a technical recommendation to my supervisor, I want to export any specific answer (including its question, generated response, confidence rating, and cited sources) into a clean, downloadable PDF report, so that I can attach verified documentation to work orders.

### Landing Page & Product Presentation
14. As a hiring manager or recruiter visiting the application, I want to land on an editorial landing page built with the Adaline design system, so that I immediately understand Contexure's value proposition, architecture, and capabilities before entering the interactive chat.
15. As a visitor browsing the landing page, I want to see visual highlights of key architectural features (Docling parsing, local embeddings, Qdrant vector search, FlashRank reranking, guardrails), so that I can assess the candidate's engineering depth and design maturity.
16. As a visitor, I want a clear call-to-action button on the landing page that transitions me seamlessly into the live chatbot workspace.

### Admin & Knowledge Base Management
17. As a system administrator, I want to log into the admin portal using GitHub OAuth, so that only authorized maintainers can upload or delete technical documentation.
18. As an administrator, I want to upload new PDF datasheets via drag-and-drop, so that the document is automatically dispatched to the ingestion pipeline (parsed, chunked, embedded, and indexed in Qdrant).
19. As an administrator, I want to view a list of all currently indexed source documents (with metadata such as filename, file size, chunk count, and upload date), so that I have full visibility into the active knowledge base.
20. As an administrator, I want to delete a source document and have all its associated chunks automatically purged from Qdrant and Cloudflare R2, so that outdated equipment specs do not linger in the retrieval pool.
21. As an administrator monitoring ingestion, I want to see the status and progress of document processing (parsing, chunking, embedding, vector storage), so that I can identify any parsing errors or malformed documents.

### Observability & RAG Analytics
22. As an AI engineer reviewing system performance, I want to view an analytics dashboard showing query volume trends over time, so that I can understand system usage patterns.
23. As an AI engineer maintaining retrieval quality, I want to see the distribution of retrieval confidence scores across queries, so that I can evaluate how well user questions match the indexed knowledge base.
24. As an AI engineer diagnosing gaps in the knowledge base, I want a log of unanswered queries (queries rejected by the confidence guardrail), so that I can identify missing product datasheets or common user intents.
25. As an AI engineer monitoring system reliability, I want to see metrics on primary vs. fallback LLM invocations (Gemini vs. Groq), so that I can verify provider uptime and rate limit health.
26. As an administrator, I want to see which documents are most frequently retrieved by user queries, so that I know which equipment categories generate the highest support demand.

---

## Implementation Decisions

### Architectural Topology: Two-Tier Decoupled System
- **Frontend Layer**: Next.js App Router (TypeScript) deployed to Vercel. Handles client state, server actions, authentication via NextAuth.js, API proxying, and streaming UI with Vercel AI SDK and the Adaline design system.
- **Backend / RAG Engine Layer**: FastAPI (Python 3.11+) running in a Docker container on Hugging Face Spaces (CPU Basic: 2 vCPUs, 16GB RAM). Hosts the core ingestion pipeline, local embedding runtime, reranking engine, and retrieval orchestration.
- **Vector Storage Layer**: Qdrant Cloud managed cluster (1GB RAM free tier). Stores dense vector embeddings alongside rich structured payloads (document ID, parent chunk ID, section title, page numbers, text content, table flags).
- **Object Storage Layer**: Cloudflare R2 (10GB free tier, S3-compatible). Stores immutable raw source PDF files for in-browser viewing and archival.
- **LLM Inference Layer**: Dual-provider setup. Primary generation is served by Google Gemini 2.5 Flash via Google AI Studio API. Fallback generation automatically routes to Groq Cloud API running Llama 3.3 70B Versatile when Gemini experiences transient 429/5xx errors or rate limit exhaustion.

### Ingestion Pipeline Architecture
- **Document Parsing**: Utilizes Docling (IBM Research) in the Python backend. Docling executes layout analysis to extract markdown representations preserving heading hierarchies (`#`, `##`, `###`), list structures, and complex tabular data layouts.
- **Chunking Strategy**: Combined Structure-Aware + Hierarchical (Parent-Child) chunking:
  - Documents are segmented along structural boundaries (headings and tables) into semantic Parent Chunks (~1,000–2,000 tokens).
  - Each Parent Chunk is subdivided into smaller Child Chunks (~200–400 tokens) with contextual headers prepended.
  - Both Child Chunks and their parent references are indexed. Retrieval searches over Child Chunks for precision, while the entire Parent Chunk is reconstructed and supplied to the LLM for generation context.
- **Embedding Model**: `nomic-ai/nomic-embed-text-v1.5` loaded locally via `fastembed` (ONNX Runtime) on the Python backend. Uses 768-dimensional embeddings with an 8,192 token maximum input length. Embeddings are generated with the appropriate query prefix (`search_query: `) or document prefix (`search_document: `).

### Retrieval, Reranking & Guardrail Pipeline
- **Vector Retrieval**: Queries are converted to 768-dim embeddings and sent to Qdrant Cloud to fetch top-20 candidate child chunks using cosine distance.
- **Reranking**: Candidate chunks are evaluated locally through `FlashRank` (ultra-lightweight CPU cross-encoder reranker) to produce a refined top-5 ranking.
- **Confidence Guardrail**:
  - Each retrieved chunk has an associated normalized similarity score from Qdrant/FlashRank.
  - If the highest-scoring candidate falls below the configured confidence threshold ($\theta = 0.65$), the system bypasses LLM generation entirely and immediately streams a polite, deterministic out-of-scope refusal response.
  - If confidence meets or exceeds the threshold, the corresponding Parent Chunks are assembled into the LLM prompt.
- **System Prompt Guardrail**: The LLM prompt explicitly instructs the model:
  - To answer exclusively from the provided context chunks.
  - To never assume or extrapolate unlisted technical specifications.
  - To output citations corresponding directly to numbered chunk references.
  - To answer in the identical language of the user's query.

### Frontend & Design System
- **Design System Implementation**: Built strictly according to `DESIGN.md` ("Adaline"):
  - Light palette: Linen background (`#f8f9f5`), Bone cards (`#eff2e8`), Mist borders (`#e1e6df`), Forest Ink text (`#0a1d08`), Olive Press headings (`#2b390a`), Sage Leaf accents (`#4a6d47`), and Crimson Specimen outlines (`#991e4b`).
  - Typography stack: Newsreader 300 for display hero anchors, Akkurat for UI and body copy, Fragment Mono / ui-monospace for badges, tracking tags, and trace metadata.
  - Surface elevation: Flat with 1px hairline borders; zero drop shadows; 20px pill buttons and 10px rounded cards.
- **Streaming UI**: Utilizes Vercel AI SDK (`useChat`) communicating with Next.js `/api/chat` proxy route, streaming Server-Sent Events (SSE) from the FastAPI backend.
- **Citation Components**: Footnote-style expandable drawer/popover displaying citation badges `[1]`, `[2]`, showing source document name, page numbers, confidence score, and exact excerpt.
- **PDF Export**: Client-side PDF generation (e.g. via `@react-pdf/renderer` or `jspdf`) rendering single-answer specification sheets with branding and citations.

### API Contracts
- `POST /api/v1/query`: Accepts `{ query: string, conversation_id?: string, stream?: boolean, filters?: object }`. Returns an SSE stream with event tokens (`data: {"token": "..."}`), citations (`event: citations`), and metadata (`event: meta`).
- `POST /api/v1/ingest`: Multipart form upload accepting PDF file, document title, category, and metadata. Triggers asynchronous Docling parsing, chunking, embedding, and Qdrant ingestion. Returns document ID and chunk statistics.
- `GET /api/v1/documents`: Lists all indexed documents with chunk count, file size, upload timestamp, and status.
- `DELETE /api/v1/documents/{id}`: Deletes all associated vectors from Qdrant and files from R2.
- `GET /api/v1/analytics`: Returns aggregated metrics on query counts, average confidence scores, low-confidence rejection logs, and top-retrieved documents.
- `GET /api/v1/health`: Returns health status of FastAPI backend, local embedding engine, Qdrant connection, and LLM provider latency.

---

## Testing Decisions

### Testing Philosophy & Seams
Tests will verify external behavior and system integration rather than private internal implementation details. The test suite is organized across three primary seams:

1. **Backend Integration Seam (FastAPI Service Layer)**:
   - The primary test boundary. Tests make real HTTP and SSE requests against the FastAPI application (`TestClient` / `httpx`).
   - Qdrant Cloud and external LLM APIs (Gemini/Groq) are injected via adapter interfaces that can be swapped with in-memory or recorded mocks during automated testing.
   - Verifies: Full ingestion pipeline (PDF bytes $\rightarrow$ chunk creation $\rightarrow$ embedding generation $\rightarrow$ vector storage), query processing, FlashRank reranking execution, confidence threshold rejection logic, fallback routing when primary LLM fails, and SSE streaming formatting.

2. **Frontend Integration Seam (Next.js Application Layer)**:
   - Tests run using Vitest / React Testing Library and Playwright for E2E flows.
   - Verifies: Landing page rendering against Adaline design tokens, chat interface message flow, streaming response assembly, citation badge expansion, suggested question click-through, comparison tool triggers, and admin route protection via NextAuth session mock.

3. **Core Domain Pure Logic Seam**:
   - Unit tests targeting pure helper modules: structure-aware markdown chunking boundaries, parent-child ID graph linking, prompt construction sanitization, and citation tag extraction.

### Test Coverage Criteria
- **Guardrail Enforcement**: Verified with explicit tests confirming that simulated low-similarity retrieval ($< 0.65$) results in immediate refusal without invoking LLM generation mocks.
- **Fallback Resilience**: Verified with tests where Gemini returns HTTP 429 / 500, asserting seamless fallback to Groq mock with zero user-visible error.
- **Multilingual Routing**: Verified with test fixtures in Indonesian, English, and German asserting prompt instructions enforce matched language generation.

---

## Out of Scope

- Self-hosted GPU infrastructure or running 70B+ LLMs on local server hardware.
- User account creation, social login, or profiles for public chat users (public chat uses client-side localStorage).
- Audio transcription, voice chat, or video input processing.
- Non-standard file formats (CAD drawings, STEP files, executable software manuals, scanned handwritten notes requiring heavy OCR).
- Automated web scraping or continuous crawling of equipment manufacturer portals.
- Paid commercial subscriptions or enterprise multi-tenant billing systems.

---

## Further Notes

- **Design Reference**: All visual styling, components, color tokens, and font families must strictly adhere to [`DESIGN.md`](file:///f:/Projects/Portofolio/rag-ai-chatbot/DESIGN.md).
- **Domain Glossary**: Code symbols, API field names, and documentation must strictly use terms defined in [`CONTEXT.md`](file:///f:/Projects/Portofolio/rag-ai-chatbot/CONTEXT.md) (Chunk, Source Document, Retrieval, Generation, Citation, Confidence Score, Reranking, Ingestion Pipeline, Knowledge Base, Guardrail).
- **Architectural Reference**: Core decisions are recorded in [`docs/adr/0001-two-tier-architecture.md`](file:///f:/Projects/Portofolio/rag-ai-chatbot/docs/adr/0001-two-tier-architecture.md), [`docs/adr/0002-qdrant-cloud-over-pinecone.md`](file:///f:/Projects/Portofolio/rag-ai-chatbot/docs/adr/0002-qdrant-cloud-over-pinecone.md), and [`docs/adr/0003-local-embedding-model.md`](file:///f:/Projects/Portofolio/rag-ai-chatbot/docs/adr/0003-local-embedding-model.md).
- **Phase Breakdown**:
  - **Phase 1 (MVP)**: Core Q&A, streaming responses, cited answers, confidence guardrail, multi-turn memory, Gemini + Groq fallback, suggested questions, Adaline landing page.
  - **Phase 2**: Admin dashboard, NextAuth.js GitHub OAuth, document upload & deletion UI, RAG analytics.
  - **Phase 3**: Multi-document comparison (natural language + UI), single-answer PDF export.
