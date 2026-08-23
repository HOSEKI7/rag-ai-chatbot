from typing import List
from fastembed import TextEmbedding

# Lightweight, high-accuracy embedding model for Contexure RAG (384 dimensions, <40MB RAM)
DEFAULT_EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
EMBEDDING_DIMENSION = 384


class EmbeddingService:
    """
    Local embedding engine running ONNX Runtime on CPU via FastEmbed.
    Produces normalized 384-dimensional vectors with zero external API calls.
    """

    def __init__(self, model_name: str = DEFAULT_EMBEDDING_MODEL):
        self.model_name = model_name
        self._model = TextEmbedding(model_name=self.model_name)

    def embed_document(self, text: str) -> List[float]:
        """Embed a single document chunk with 'search_document: ' prefix."""
        return self.embed_documents([text])[0]

    def embed_documents(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Batch embed document chunks with 'search_document: ' prefix."""
        prefixed = [f"search_document: {t}" for t in texts]
        embeddings = list(self._model.embed(prefixed, batch_size=batch_size))
        return [e.tolist() for e in embeddings]

    def embed_query(self, query: str) -> List[float]:
        """Embed a user search query with 'search_query: ' prefix."""
        prefixed = f"search_query: {query}"
        embeddings = list(self._model.embed([prefixed]))
        return embeddings[0].tolist()


_embedding_service_instance: EmbeddingService | None = None


def get_embedding_service() -> EmbeddingService:
    """Returns cached singleton instance of the EmbeddingService."""
    global _embedding_service_instance
    if _embedding_service_instance is None:
        _embedding_service_instance = EmbeddingService()
    return _embedding_service_instance
