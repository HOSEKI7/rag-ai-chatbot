import io
import re
from typing import Dict, List, Optional
from pydantic import BaseModel
import pymupdf
import pymupdf4llm


class ParsedDocument(BaseModel):
    markdown: str
    title: str
    filename: str
    page_count: int
    page_map: Dict[int, str] = {}


def parse_pdf_bytes(pdf_bytes: bytes, filename: str = "source_document.pdf") -> ParsedDocument:
    """
    Parses PDF bytes into structured markdown representation, preserving tables and section hierarchy,
    along with page mapping metadata.
    """
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)
        title = filename
        if doc.metadata and doc.metadata.get("title"):
            extracted_title = doc.metadata["title"].strip()
            if extracted_title:
                title = extracted_title

        page_map: Dict[int, str] = {}
        for page_idx in range(page_count):
            page_text = doc[page_idx].get_text().strip()
            page_map[page_idx + 1] = page_text

        # Extract structured markdown across entire document
        md_text = pymupdf4llm.to_markdown(doc)
        doc.close()

        cleaned_md = re.sub(r"\n{3,}", "\n\n", md_text).strip()
        return ParsedDocument(
            markdown=cleaned_md,
            title=title,
            filename=filename,
            page_count=page_count,
            page_map=page_map,
        )

    except Exception:
        # Fallback extraction
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)
        pages_text: List[str] = []
        page_map: Dict[int, str] = {}

        for i in range(page_count):
            page_num = i + 1
            text = doc[i].get_text().strip()
            page_map[page_num] = text
            pages_text.append(f"## Page {page_num}\n\n{text}")

        doc.close()
        fallback_md = "\n\n".join(pages_text).strip()
        return ParsedDocument(
            markdown=fallback_md,
            title=filename,
            filename=filename,
            page_count=page_count,
            page_map=page_map,
        )
