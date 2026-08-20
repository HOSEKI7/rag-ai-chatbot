from fastapi import APIRouter
from app.services.compare_service import (
    compare_documents_pipeline,
    CompareRequest,
    ComparePipelineResult,
)

router = APIRouter()


@router.post("/compare", response_model=ComparePipelineResult)
async def compare_endpoint(request: CompareRequest) -> ComparePipelineResult:
    """
    Execute multi-document technical specification comparison across 2 or more datasheets.
    """
    return compare_documents_pipeline(
        doc_ids=request.doc_ids,
        query=request.query,
        attributes=request.attributes,
    )
