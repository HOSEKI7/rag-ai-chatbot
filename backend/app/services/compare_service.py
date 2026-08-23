from typing import List, Optional
from pydantic import BaseModel, Field
from app.services.retrieval_pipeline import CitationMetadata
from app.services.vector_store import get_vector_store
from app.services.embedding import get_embedding_service
from app.services.reranker import get_reranker_service


class CompareRequest(BaseModel):
    doc_ids: List[str] = Field(..., min_length=2, description="List of at least 2 document IDs to compare")
    query: Optional[str] = Field(None, description="Optional focus question or attributes to compare")
    attributes: Optional[List[str]] = Field(None, description="Optional specific parameters to compare")


class ComparePipelineResult(BaseModel):
    status: str
    compared_documents: List[str]
    citations: List[CitationMetadata]
    reconstructed_context: str
    system_prompt: str
    user_prompt: str
    passed_guardrail: bool
    confidence_score: float
    refusal_message: Optional[str] = None


COMPARISON_SYSTEM_PROMPT = """You are Contexure, an expert industrial automation and technical support AI.
You are tasked with comparing multiple industrial equipment datasheets side-by-side.

CRITICAL INSTRUCTIONS:
1. Base every claim EXCLUSIVELY on the provided XML context blocks.
2. Structure your comparison using a clear markdown comparison table with columns:
   | Specification Parameter | [Product A Title] | [Product B Title] | Technical Delta / Key Difference |
3. Compare key attributes such as:
   - Rated Output Power & Torque / Sensing Range
   - Operating Voltage & Frequency
   - Efficiency Class & Standard Compliance
   - Enclosure (IP Rating) & Environmental Tolerances
   - Communication Protocols & Bus Interfaces
4. Insert bracketed footnote citation anchors like [1], [2] next to every compared figure or assertion.
5. If a parameter is not mentioned in a document's context, write "Not specified in datasheet".
6. Do NOT hallucinate or extrapolate beyond the provided text."""


def compare_documents_pipeline(
    doc_ids: List[str],
    query: Optional[str] = None,
    attributes: Optional[List[str]] = None,
) -> ComparePipelineResult:
    """
    Executes balanced multi-document retrieval and constructs comparative RAG prompt.
    """
    vector_store = get_vector_store()
    embedding_service = get_embedding_service()
    reranker = get_reranker_service()

    search_query = query or "technical specifications electrical ratings operating parameters dimensions"
    query_vector = embedding_service.embed_query(search_query)

    all_citations: List[CitationMetadata] = []
    doc_context_blocks: List[str] = []
    max_confidence = 0.0
    cite_counter = 1

    for doc_id in doc_ids:
        # Retrieve candidates for this specific document
        raw_chunks = vector_store.retrieve_chunks(
            query_vector=query_vector,
            limit=10,
            filter_doc_ids=[doc_id],
        )

        if not raw_chunks:
            doc_context_blocks.append(
                f'<document id="{doc_id}">\n<content>No indexed technical specifications found for document ID {doc_id}.</content>\n</document>'
            )
            continue

        # Rerank candidates for this document
        reranked = reranker.rerank(
            query=search_query,
            candidates=raw_chunks,
            top_k=3,
        )

        doc_title = reranked[0].document_title if reranked else doc_id
        for c in reranked:
            if c.confidence_score > max_confidence:
                max_confidence = c.confidence_score

        combined_doc_text = "\n\n".join(
            f"### Section: {c.section_title} (Page {c.page_number})\n{c.parent_text or c.text}"
            for c in reranked
        )

        doc_context_blocks.append(
            f'<document id="{doc_id}" title="{doc_title}">\n{combined_doc_text}\n</document>'
        )

        for c in reranked:
            all_citations.append(
                CitationMetadata(
                    index=cite_counter,
                    document_id=c.document_id,
                    document_title=c.document_title,
                    category=c.category,
                    section_title=c.section_title,
                    page_number=c.page_number,
                    chunk_id=c.id,
                    parent_id=c.parent_id,
                    excerpt=c.text[:200] + "...",
                    confidence_score=c.confidence_score,
                )
            )
            cite_counter += 1

    reconstructed_context = (
        "<comparison_context>\n" + "\n\n".join(doc_context_blocks) + "\n</comparison_context>"
    )

    attr_instruction = (
        f"\nFocus specifically on the following parameters: {', '.join(attributes)}"
        if attributes
        else ""
    )

    user_prompt = f"""Compare the technical specifications between the selected equipment datasheets.
{attr_instruction}

Comparison Question: {search_query}

Context:
{reconstructed_context}

Provide a comprehensive markdown comparison table followed by key trade-off analysis."""

    passed_guardrail = len(all_citations) > 0 and (max_confidence >= 0.65 or len(doc_ids) >= 2)
    refusal_msg = None if passed_guardrail else "No verified technical specifications could be retrieved for the requested equipment comparison."

    return ComparePipelineResult(
        status="success",
        compared_documents=doc_ids,
        citations=all_citations,
        reconstructed_context=reconstructed_context,
        system_prompt=COMPARISON_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        passed_guardrail=passed_guardrail,
        confidence_score=max_confidence if max_confidence > 0 else 0.80,
        refusal_message=refusal_msg,
    )
