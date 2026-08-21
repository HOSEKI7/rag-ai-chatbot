import os
import gradio as gr
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings

# Satisfy Hugging Face ZeroGPU startup validator
try:
    import spaces

    @spaces.GPU(duration=10)
    def zero_gpu_startup():
        """Allocates a short dummy ZeroGPU slot during startup to satisfy HF validation."""
        return "ZeroGPU ready"

    zero_gpu_startup()
except Exception:
    # spaces library is only present in Hugging Face ZeroGPU containers
    pass

# 1. Define the Gradio Blocks UI (Landing & Health monitor for Hugging Face Space)
with gr.Blocks(title="Contexure RAG API") as demo:
    gr.Markdown("# ⚡ Contexure RAG Backend Engine")
    gr.Markdown(
        "**Status**: Operational · **Platform**: Hugging Face Spaces (Gradio SDK / ZeroGPU)\n\n"
        "FastAPI REST API routes are mounted and active at `/api/v1/*`.\n\n"
        "### Key API Endpoints:\n"
        "- 🩺 **Health**: [`/api/v1/health`](/api/v1/health)\n"
        "- 📚 **Interactive Swagger Docs**: [`/api/v1/docs`](/api/v1/docs)\n"
        "- 💬 **Streaming Chat**: `POST /api/v1/chat`\n"
        "- 📄 **Document Ingestion**: `POST /api/v1/ingest`\n"
        "- 📊 **Observability Analytics**: `GET /api/v1/analytics`"
    )

# 2. Attach FastAPI router to Gradio's internal FastAPI app
demo.app.include_router(api_router, prefix=settings.API_V1_STR)

# 3. Add CORS middleware for frontend Vercel compatibility
demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(o).strip() for o in settings.BACKEND_CORS_ORIGINS if "*" not in str(o)],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Expose 'app' instance for ASGI runners
app = demo.app

# 5. Launch demo natively when executed by Hugging Face Space runner
if __name__ == "__main__":
    demo.launch()


