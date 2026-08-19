# Local embedding model over API-based embeddings

Document chunks are embedded using nomic-embed-text-v1.5 running locally on the FastAPI backend (Hugging Face Spaces, 16GB RAM) via FastEmbed (ONNX Runtime), rather than calling an external embedding API like Google text-embedding-004.

The local model eliminates API rate limits during bulk document ingestion, removes network latency from the retrieval path, avoids data privacy concerns (document content never leaves the server), and costs nothing. The 8192-token context window of nomic-embed-text is critical for industrial datasheets where meaningful sections can be long. At ~550MB, the model fits comfortably within the 16GB RAM budget alongside Docling (~2GB) and FlashRank.

The trade-off is a heavier container image and longer cold-start time on HF Spaces versus unlimited, zero-latency, zero-cost embeddings.
