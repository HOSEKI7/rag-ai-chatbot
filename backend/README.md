# Contexure Backend API

FastAPI-powered RAG Engine for industrial datasheet technical support and specification Q&A.

## Local Development

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run FastAPI dev server
uvicorn app.main:app --reload --port 8000
```

## Production Deployment (Render.com)

- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt && python prewarm.py`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## API Documentation

- Swagger UI: `/api/v1/docs`
- Health Check: `/api/v1/health`
