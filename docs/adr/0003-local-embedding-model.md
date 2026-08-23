# Local embedding model over API-based embeddings

Document chunks are embedded using `BAAI/bge-small-en-v1.5` (384 dimensions) running locally on the FastAPI backend (Render.com Web Service, 512MB RAM free tier) via FastEmbed (ONNX Runtime), rather than calling an external embedding API like Google text-embedding-004.

The local model eliminates API rate limits during bulk document ingestion, removes network latency from the retrieval path, avoids data privacy concerns (document content never leaves the server), and costs nothing. At ~33MB on disk and ~187MB RAM footprint during inference, `BAAI/bge-small-en-v1.5` achieves competitive MTEB retrieval accuracy while fitting comfortably within the 512MB container memory budget alongside FastAPI and FlashRank (~220MB total peak RAM). Models are pre-warmed at build time via `prewarm.py` to ensure instant sub-500ms response times.
