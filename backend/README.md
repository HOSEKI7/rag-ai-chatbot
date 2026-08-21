---
title: Contexure Backend
emoji: ⚡
colorFrom: green
colorTo: indigo
sdk: gradio
app_file: app.py
pinned: false
---

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

## API Documentation

- Swagger UI: `http://localhost:8000/api/v1/docs`
- Health Check: `http://localhost:8000/api/v1/health`
