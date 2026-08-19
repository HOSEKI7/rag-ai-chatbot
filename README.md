# Contexure

> AI-Powered Technical Support & Product Knowledge Chatbot for Industrial Equipment Datasheets.

## Architecture

Contexure is built with a two-tier decoupled architecture:
- **Frontend**: Next.js 15+ App Router, TypeScript, Tailwind CSS, Vercel AI SDK, implementing the **Adaline** editorial design system. Deployed on **Vercel**.
- **Backend**: Python 3.11+ FastAPI RAG Engine, Docling document parsing, local `nomic-embed-text-v1.5` embeddings via FastEmbed, Qdrant Cloud vector search, FlashRank reranker, and Google Gemini 2.5 Flash / Groq fallback generation. Deployed on **Hugging Face Spaces** (Docker).

## Getting Started

### Prerequisites
- Node.js 20+ & `pnpm`
- Python 3.11+

### Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run FastAPI dev server
uvicorn app.main:app --reload --port 8000
```

Backend API Docs available at `http://localhost:8000/api/v1/docs`.

### Frontend Setup

```bash
cd frontend
pnpm install
cp .env.example .env.local

# Run Next.js dev server
pnpm dev
```

Frontend app available at `http://localhost:3000`.

### Running Tests

```bash
# Backend tests
cd backend
pytest tests

# Frontend tests
cd frontend
pnpm test
```
