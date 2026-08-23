import pytest
from app.services.embedding import get_embedding_service, EmbeddingService


def test_embedding_service_produces_384_dim_vectors():
    """Verify local FastEmbed engine produces normalized 384-dim embeddings."""
    service = get_embedding_service()
    
    # Test document embedding
    doc_text = "The Siemens 1LE1 motor delivers 15 kW output power with IE3 efficiency rating."
    doc_vector = service.embed_document(doc_text)
    
    assert isinstance(doc_vector, list)
    assert len(doc_vector) == 384
    assert all(isinstance(val, float) for val in doc_vector)

    # Test query embedding
    query_text = "What is the output power of Siemens 1LE1?"
    query_vector = service.embed_query(query_text)
    
    assert isinstance(query_vector, list)
    assert len(query_vector) == 384


def test_embedding_service_batch():
    """Verify batch embedding generation produces matching count of vectors."""
    service = get_embedding_service()
    texts = [
        "First technical document chunk on electric motors.",
        "Second technical document chunk on temperature sensors.",
    ]
    vectors = service.embed_documents(texts)
    assert len(vectors) == 2
    assert len(vectors[0]) == 384
    assert len(vectors[1]) == 384
