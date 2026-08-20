import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from app.core.config import settings
from app.services.chunker import ParentChunk, ChildChunk


class RetrievedChunk(BaseModel):
    id: str
    document_id: str
    document_title: str
    category: str
    section_title: str
    parent_id: str
    text: str
    parent_text: str
    token_count: int
    is_table: bool
    page_number: int = 1
    score: float


class IndexedDocument(BaseModel):
    document_id: str
    document_title: str
    category: str
    chunk_count: int


class VectorStoreService:
    """
    Manages vector storage, indexing, and semantic retrieval with Qdrant (Cloud or In-Memory).
    """

    def __init__(
        self,
        location: Optional[str] = None,
        url: Optional[str] = None,
        api_key: Optional[str] = None,
        collection_name: Optional[str] = None,
    ):
        self.collection_name = collection_name or settings.QDRANT_COLLECTION

        if location:
            # Used for tests (e.g. ":memory:")
            self.client = QdrantClient(location=location)
        elif url or settings.QDRANT_URL:
            # Managed Qdrant Cloud or remote server
            self.client = QdrantClient(
                url=url or settings.QDRANT_URL,
                api_key=api_key or (settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None),
            )
        else:
            # Fallback to in-memory local storage when no external credentials are configured
            self.client = QdrantClient(location=":memory:")

    def ensure_collection(self, vector_size: int = 768) -> None:
        """Creates Qdrant collection with Cosine distance if it does not already exist."""
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)

        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )

    def upsert_chunks(
        self,
        parents: List[ParentChunk],
        children: List[ChildChunk],
        embeddings: List[List[float]],
    ) -> int:
        """
        Stores child vector embeddings and parent text payloads into Qdrant.
        """
        self.ensure_collection(vector_size=len(embeddings[0]) if embeddings else 768)

        # Map parent ID to full parent chunk text
        parent_map = {p.id: p.text for p in parents}

        points: List[PointStruct] = []
        for child, emb in zip(children, embeddings):
            # Generate deterministic UUID for point ID from chunk string ID
            point_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, child.id))
            
            payload = {
                "chunk_id": child.id,
                "parent_id": child.parent_id,
                "document_id": child.document_id,
                "document_title": child.document_title,
                "category": child.category,
                "section_title": child.section_title,
                "text": child.text,
                "parent_text": parent_map.get(child.parent_id, child.text),
                "token_count": child.token_count,
                "is_table": child.is_table,
                "page_number": child.page_number,
            }

            points.append(
                PointStruct(
                    id=point_uuid,
                    vector=emb,
                    payload=payload,
                )
            )

        if points:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points,
            )

        return len(points)

    def retrieve_chunks(
        self,
        query_vector: List[float],
        limit: int = 20,
        score_threshold: Optional[float] = None,
        filter_doc_ids: Optional[List[str]] = None,
    ) -> List[RetrievedChunk]:
        """
        Executes vector similarity retrieval on child chunks, returning ranked candidate payloads.
        """
        self.ensure_collection(vector_size=len(query_vector))

        query_filter = None
        if filter_doc_ids:
            conditions = [
                FieldCondition(key="document_id", match=MatchValue(value=doc_id))
                for doc_id in filter_doc_ids
            ]
            query_filter = Filter(should=conditions)

        response = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit,
            score_threshold=score_threshold,
            query_filter=query_filter,
            with_payload=True,
        )

        hits: List[RetrievedChunk] = []
        for point in response.points:
            payload = point.payload or {}
            hits.append(
                RetrievedChunk(
                    id=payload.get("chunk_id", str(point.id)),
                    document_id=payload.get("document_id", ""),
                    document_title=payload.get("document_title", ""),
                    category=payload.get("category", "Datasheet"),
                    section_title=payload.get("section_title", ""),
                    parent_id=payload.get("parent_id", ""),
                    text=payload.get("text", ""),
                    parent_text=payload.get("parent_text", ""),
                    token_count=payload.get("token_count", 0),
                    is_table=payload.get("is_table", False),
                    page_number=payload.get("page_number", 1),
                    score=float(point.score),
                )
            )

        return hits

    def list_indexed_documents(self) -> List[IndexedDocument]:
        """
        Lists all distinct indexed source documents with their chunk counts.
        """
        self.ensure_collection()
        records, _ = self.client.scroll(
            collection_name=self.collection_name,
            limit=1000,
            with_payload=True,
            with_vectors=False,
        )

        docs: Dict[str, Dict[str, Any]] = {}
        for record in records:
            payload = record.payload or {}
            doc_id = payload.get("document_id")
            if not doc_id:
                continue

            if doc_id not in docs:
                docs[doc_id] = {
                    "document_id": doc_id,
                    "document_title": payload.get("document_title", doc_id),
                    "category": payload.get("category", "Datasheet"),
                    "chunk_count": 0,
                }
            docs[doc_id]["chunk_count"] += 1

        return [IndexedDocument(**d) for d in docs.values()]

    def delete_document(self, document_id: str) -> None:
        """
        Deletes all chunks belonging to a document from Qdrant.
        """
        self.ensure_collection()
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
        )


_vector_store_instance: VectorStoreService | None = None


def get_vector_store() -> VectorStoreService:
    """Returns cached singleton instance of VectorStoreService."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStoreService()
    return _vector_store_instance
