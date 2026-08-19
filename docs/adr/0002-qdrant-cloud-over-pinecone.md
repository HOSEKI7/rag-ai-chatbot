# Qdrant Cloud over Pinecone for vector storage

Vector embeddings are stored in Qdrant Cloud (free tier, 1GB RAM managed cluster) rather than Pinecone Serverless or an embedded/self-hosted vector database.

Qdrant was chosen over Pinecone because the portfolio targets AI/ML engineering roles at industrial companies, where demonstrating familiarity with open-source, production-grade AI infrastructure carries more weight than using a SaaS wrapper. Qdrant's advanced features (multi-vector support, payload filtering, hybrid search) provide richer interview talking points. Its free tier is always-on with no cold starts, which matters for a live demo.

Qdrant Cloud (managed) was chosen over Qdrant embedded because data must survive Hugging Face Spaces restarts without re-indexing all documents.

## Considered Options

- **Pinecone Serverless**: Simpler API, strong brand recognition, but proprietary and shallow — limited differentiation signal for an AI/ML engineer portfolio.
- **Neon Postgres + pgvector**: Shows relational DB + vector skills in one, but adds SQL overhead for a search-first workload with no relational data model.
- **Qdrant embedded on HF Spaces**: Zero external dependencies, but data loss on container restart requires a persistence/re-index strategy that adds complexity.
