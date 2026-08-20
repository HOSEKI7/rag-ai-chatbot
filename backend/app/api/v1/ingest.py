import re
import uuid
from typing import List, Optional, Dict
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from app.services.parser import parse_pdf_bytes
from app.services.chunker import chunk_document_structure_aware
from app.services.embedding import get_embedding_service
from app.services.vector_store import get_vector_store, IndexedDocument

router = APIRouter()


class IngestResponse(BaseModel):
    status: str
    document_id: str
    document_title: str
    category: str
    page_count: int
    parent_chunk_count: int
    child_chunk_count: int
    message: str


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(
    file: UploadFile = File(...),
    document_title: Optional[str] = Form(None),
    category: Optional[str] = Form("Datasheet"),
) -> IngestResponse:
    """
    Ingest a PDF source document:
    1. Parse layout structure & tables into markdown via Docling / PyMuPDF
    2. Execute structure-aware & hierarchical parent-child chunking
    3. Generate normalized 768-dim embeddings locally with nomic-embed-text
    4. Store chunks and payloads in Qdrant vector database
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF source documents are supported for ingestion.",
        )

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded source document is empty.",
        )

    # 1. Parse Source Document
    parsed_markdown, metadata = parse_pdf_bytes(pdf_bytes, filename=file.filename)
    
    title = document_title or metadata.get("title") or file.filename
    # Generate clean document ID
    sanitized_slug = re.sub(r"[^a-zA-Z0-9_-]", "_", title.lower())[:24]
    doc_id = f"doc_{sanitized_slug}_{uuid.uuid4().hex[:6]}"
    doc_category = category or "Datasheet"

    # 2. Chunking (Structure-Aware + Hierarchical)
    parents, children = chunk_document_structure_aware(
        text=parsed_markdown,
        document_id=doc_id,
        document_title=title,
        category=doc_category,
    )

    if not children:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract any text chunks from the provided source document.",
        )

    # 3. Local Embedding
    embedding_service = get_embedding_service()
    child_texts = [child.text for child in children]
    embeddings = embedding_service.embed_documents(child_texts)

    # 4. Qdrant Vector Storage
    vector_store = get_vector_store()
    vector_store.upsert_chunks(
        parents=parents,
        children=children,
        embeddings=embeddings,
    )

    return IngestResponse(
        status="success",
        document_id=doc_id,
        document_title=title,
        category=doc_category,
        page_count=metadata.get("page_count", 1),
        parent_chunk_count=len(parents),
        child_chunk_count=len(children),
        message=f"Successfully ingested {title} ({len(children)} searchable vectors generated)",
    )


@router.get("/documents", response_model=List[IndexedDocument])
async def list_documents() -> List[IndexedDocument]:
    """List all currently indexed source documents in Qdrant with chunk counts."""
    vector_store = get_vector_store()
    return vector_store.list_indexed_documents()


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str) -> Dict[str, str]:
    """Purge all chunks associated with a source document from Qdrant."""
    vector_store = get_vector_store()
    vector_store.delete_document(document_id=document_id)
    return {
        "status": "success",
        "message": f"Source document '{document_id}' and all associated vector chunks purged.",
    }
