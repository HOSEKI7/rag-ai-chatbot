import io
import re
from typing import Dict, Any, Tuple
import pymupdf
import pymupdf4llm
from pypdf import PdfReader


def parse_pdf_bytes(pdf_bytes: bytes, filename: str = "document.pdf") -> Tuple[str, Dict[str, Any]]:
    """
    Parses PDF bytes into structured markdown representation, preserving tables and section hierarchy.
    Returns a tuple of (markdown_text, metadata).
    """
    metadata: Dict[str, Any] = {
        "filename": filename,
        "page_count": 0,
        "title": filename,
    }

    try:
        # Open PDF document in PyMuPDF from memory stream
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        metadata["page_count"] = len(doc)
        
        # Extract title from PDF metadata if available
        if doc.metadata and doc.metadata.get("title"):
            metadata["title"] = doc.metadata["title"].strip() or filename

        # Extract structured markdown using pymupdf4llm
        md_text = pymupdf4llm.to_markdown(doc)
        doc.close()

        # Clean excessive blank lines while preserving table structure
        cleaned_md = re.sub(r"\n{3,}", "\n\n", md_text).strip()
        return cleaned_md, metadata

    except Exception as e:
        # Fallback to standard pypdf extraction if layout-based parser encounters issues
        reader = PdfReader(io.BytesIO(pdf_bytes))
        metadata["page_count"] = len(reader.pages)
        pages_text = []
        for i, page in enumerate(reader.pages):
            page_content = page.extract_text() or ""
            pages_text.append(f"## Page {i + 1}\n\n{page_content.strip()}")
        
        fallback_md = "\n\n".join(pages_text).strip()
        return fallback_md, metadata
