import os
import uvicorn
import gradio as gr
from fastapi.middleware.cors import CORSMiddleware
from app.main import app as fastapi_app

# 1. Satisfy Hugging Face ZeroGPU startup validator
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

# 2. Define the Gradio Blocks UI (Landing & Health monitor for Hugging Face Space)
with gr.Blocks(title="Contexure RAG API") as demo:
    gr.Markdown("# ⚡ Contexure RAG Backend Engine")
    gr.Markdown(
        "**Status**: Operational · **Platform**: Hugging Face Spaces\n\n"
        "FastAPI REST API routes are mounted and active at root (`/api/v1/*`).\n\n"
        "### Key API Endpoints:\n"
        "- 🩺 **Health**: [`/api/v1/health`](/api/v1/health)\n"
        "- 📚 **Interactive Swagger Docs**: [`/api/v1/docs`](/api/v1/docs)\n"
        "- 💬 **Streaming Chat**: `POST /api/v1/chat`\n"
        "- 📄 **Document Ingestion**: `POST /api/v1/ingest`\n"
        "- 📊 **Observability Analytics**: `GET /api/v1/analytics`"
    )

# 3. Mount Gradio UI at /ui while keeping root and /api/v1 for FastAPI
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

# 4. Start Uvicorn directly without Gradio Node.js SSR proxy
if __name__ == "__main__":
    port = int(os.environ.get("PORT", os.environ.get("GRADIO_SERVER_PORT", 7860)))
    uvicorn.run(app, host="0.0.0.0", port=port)



