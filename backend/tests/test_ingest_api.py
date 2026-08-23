import pytest
import pymupdf
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.services.vector_store import VectorStoreService


def create_sample_pdf_bytes() -> bytes:
    """Helper to generate a valid PDF containing technical datasheet text in memory."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text(
        (50, 50),
        "Siemens 1LE1 Motor Datasheet\n\n"
        "Technical Specifications:\n"
        "- Rated Output: 15 kW\n"
        "- Efficiency Class: IE3\n"
        "- Rated Speed: 1475 RPM\n"
        "- Operating Voltage: 400V 50Hz\n"
        "- Protection Class: IP55\n",
    )
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


@pytest.mark.asyncio
async def test_ingest_document_and_verify_qdrant_points(monkeypatch):
    """Verify POST /api/v1/ingest and direct Qdrant vector & payload verification."""
    test_store = VectorStoreService(location=":memory:", collection_name="test_ingest_collection")
    test_store.ensure_collection(vector_size=384)
    monkeypatch.setattr("app.api.v1.ingest.get_vector_store", lambda: test_store)

    pdf_bytes = create_sample_pdf_bytes()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # 1. Ingest PDF
        files = {"file": ("siemens_1le1_motor.pdf", pdf_bytes, "application/pdf")}
        data = {"document_title": "Siemens 1LE1 Motor Datasheet", "category": "Motor"}

        response = await client.post("/api/v1/ingest", files=files, data=data)
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["status"] == "success"
        assert "document_id" in res_data
        assert res_data["document_title"] == "Siemens 1LE1 Motor Datasheet"
        assert res_data["category"] == "Motor"
        assert res_data["child_chunk_count"] >= 1

        # 2. Directly query Qdrant points to verify vectors and payloads
        points, _ = test_store.client.scroll(
            collection_name=test_store.collection_name,
            with_payload=True,
            with_vectors=True,
        )
        assert len(points) == res_data["child_chunk_count"]
        first_point = points[0]
        assert len(first_point.vector) == 384
        assert first_point.payload["document_id"] == res_data["document_id"]
        assert first_point.payload["document_title"] == "Siemens 1LE1 Motor Datasheet"
        assert first_point.payload["category"] == "Motor"
        assert "parent_text" in first_point.payload
        assert len(first_point.payload["parent_text"]) > 0

        # 3. List documents
        list_res = await client.get("/api/v1/documents")
        assert list_res.status_code == 200
        docs = list_res.json()
        assert len(docs) == 1
        assert docs[0]["document_title"] == "Siemens 1LE1 Motor Datasheet"
        assert docs[0]["category"] == "Motor"

        # 4. Delete document
        doc_id = res_data["document_id"]
        del_res = await client.delete(f"/api/v1/documents/{doc_id}")
        assert del_res.status_code == 200

        # Verify deletion from Qdrant
        points_after, _ = test_store.client.scroll(
            collection_name=test_store.collection_name,
        )
        assert len(points_after) == 0
