# Two-tier architecture: Next.js frontend + Python FastAPI backend

The system is split into a TypeScript frontend (Next.js on Vercel) and a Python backend (FastAPI on Render.com) rather than a single full-stack TypeScript application.

The primary motivation is portfolio positioning: the target audience is AI/ML engineering roles at industrial technology companies, where Python proficiency and understanding of ML infrastructure are table stakes. A Python backend lets the portfolio showcase document parsing (Docling / PyMuPDF), local embedding models (BAAI/bge-small-en-v1.5 via FastEmbed), reranking (FlashRank), and vector search orchestration — all of which are invisible in a TypeScript-only stack.

The trade-off is operational complexity (two services, two deployments, cross-origin communication via SSE proxy) versus the ability to demonstrate serious AI/ML engineering depth.

## Considered Options

- **Full-stack TypeScript (Next.js API Routes)**: Simpler deployment (one Vercel service), but hides all ML pipeline work behind API calls to external services. Doesn't demonstrate Python/ML skills.
- **Python-only (Chainlit/Gradio)**: Shows Python skills but gives a "prototype" impression rather than "production application". Doesn't demonstrate full-stack capability.
