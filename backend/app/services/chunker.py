import re
from typing import List, Tuple
from pydantic import BaseModel
import tiktoken

# Initialize fast tokenizer for accurate token counting
try:
    _tokenizer = tiktoken.get_encoding("cl100k_base")
except Exception:
    _tokenizer = None


def estimate_tokens(text: str) -> int:
    """Accurately count tokens using cl100k_base, with fallback to character heuristic."""
    if _tokenizer:
        return len(_tokenizer.encode(text))
    return max(1, len(text) // 4)


class ParentChunk(BaseModel):
    id: str
    document_id: str
    document_title: str
    category: str = "Datasheet"
    section_title: str
    text: str
    token_count: int
    is_table: bool = False


class ChildChunk(BaseModel):
    id: str
    parent_id: str
    document_id: str
    document_title: str
    category: str = "Datasheet"
    section_title: str
    text: str
    token_count: int
    is_table: bool = False


def chunk_document_structure_aware(
    text: str,
    document_id: str,
    document_title: str,
    category: str = "Datasheet",
    max_parent_tokens: int = 1200,
    min_parent_tokens: int = 80,
    max_child_tokens: int = 350,
) -> Tuple[List[ParentChunk], List[ChildChunk]]:
    """
    Performs structure-aware and hierarchical (parent-child) chunking on parsed markdown:
    1. Segments markdown on heading boundaries and tables into semantic Parent Chunks without fragmentation.
    2. Subdivides each Parent Chunk into granular Child Chunks with contextual prefixes.
    """
    parent_chunks: List[ParentChunk] = []
    child_chunks: List[ChildChunk] = []

    # Split document by markdown headings (# H1, ## H2, ### H3, #### H4)
    heading_pattern = r"(?m)^(#{1,4}\s+.+)$"
    structural_blocks = re.split(heading_pattern, text)

    current_section = document_title
    section_buffer = ""
    parent_idx = 1

    for block in structural_blocks:
        block = block.strip()
        if not block:
            continue

        is_heading = bool(re.match(r"^#{1,4}\s+", block))

        if is_heading:
            # Only flush current buffer if it has reached minimum meaningful parent size
            buffer_tokens = estimate_tokens(section_buffer)
            if buffer_tokens >= min_parent_tokens:
                parent_chunks.append(
                    _create_parent_chunk(
                        parent_idx=parent_idx,
                        document_id=document_id,
                        document_title=document_title,
                        category=category,
                        section_title=current_section,
                        text=section_buffer.strip(),
                    )
                )
                parent_idx += 1
                section_buffer = ""

            current_section = re.sub(r"^#{1,4}\s+", "", block).strip()
            section_buffer += f"{block}\n\n"
        else:
            section_buffer += f"{block}\n\n"

            # If section buffer exceeds max_parent_tokens, flush into a parent chunk
            if estimate_tokens(section_buffer) >= max_parent_tokens:
                parent_chunks.append(
                    _create_parent_chunk(
                        parent_idx=parent_idx,
                        document_id=document_id,
                        document_title=document_title,
                        category=category,
                        section_title=current_section,
                        text=section_buffer.strip(),
                    )
                )
                parent_idx += 1
                section_buffer = ""

    # Flush any remaining text in section buffer
    if section_buffer.strip():
        parent_chunks.append(
            _create_parent_chunk(
                parent_idx=parent_idx,
                document_id=document_id,
                document_title=document_title,
                category=category,
                section_title=current_section,
                text=section_buffer.strip(),
            )
        )

    # Subdivide each Parent Chunk into Child Chunks
    for parent in parent_chunks:
        sub_children = _subdivide_into_children(
            parent=parent,
            max_child_tokens=max_child_tokens,
        )
        child_chunks.extend(sub_children)

    return parent_chunks, child_chunks


def _create_parent_chunk(
    parent_idx: int,
    document_id: str,
    document_title: str,
    category: str,
    section_title: str,
    text: str,
) -> ParentChunk:
    is_table = bool(re.search(r"\|.+\|\n\|[-:\s|]+\|", text))
    token_cnt = estimate_tokens(text)
    return ParentChunk(
        id=f"{document_id}-p{parent_idx:03d}",
        document_id=document_id,
        document_title=document_title,
        category=category,
        section_title=section_title,
        text=text,
        token_count=token_cnt,
        is_table=is_table,
    )


def _subdivide_into_children(
    parent: ParentChunk,
    max_child_tokens: int,
) -> List[ChildChunk]:
    """Subdivides a parent chunk into granular child chunks with contextual prefix."""
    children: List[ChildChunk] = []

    def _format_child_text(content: str) -> str:
        return f"[{parent.document_title} > {parent.section_title}]\n{content.strip()}"

    def _make_child(child_idx: int, content: str) -> ChildChunk:
        formatted = _format_child_text(content)
        return ChildChunk(
            id=f"{parent.id}-c{child_idx:03d}",
            parent_id=parent.id,
            document_id=parent.document_id,
            document_title=parent.document_title,
            category=parent.category,
            section_title=parent.section_title,
            text=formatted,
            token_count=estimate_tokens(formatted),
            is_table=bool(re.search(r"\|.+\|\n\|[-:\s|]+\|", content)),
        )

    # If parent is already smaller than child token budget, keep as single child
    if parent.token_count <= max_child_tokens:
        return [_make_child(1, parent.text)]

    # Split parent by paragraphs or table rows if large
    paragraphs = re.split(r"\n\n+", parent.text)
    child_buffer = ""
    child_idx = 1

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        # If a single paragraph/table is itself larger than max_child_tokens, split on sentences/lines
        if estimate_tokens(para) > max_child_tokens:
            if child_buffer.strip():
                children.append(_make_child(child_idx, child_buffer))
                child_idx += 1
                child_buffer = ""

            sub_sentences = re.split(r"(?<=[.!?\n])\s+", para)
            sub_buf = ""
            for sentence in sub_sentences:
                if estimate_tokens(f"{sub_buf} {sentence}") > max_child_tokens and sub_buf.strip():
                    children.append(_make_child(child_idx, sub_buf))
                    child_idx += 1
                    sub_buf = sentence
                else:
                    sub_buf = f"{sub_buf} {sentence}".strip()
            if sub_buf.strip():
                children.append(_make_child(child_idx, sub_buf))
                child_idx += 1
            continue

        test_text = f"{child_buffer}\n\n{para}".strip()
        if estimate_tokens(test_text) > max_child_tokens and child_buffer.strip():
            children.append(_make_child(child_idx, child_buffer))
            child_idx += 1
            child_buffer = para
        else:
            child_buffer = test_text

    if child_buffer.strip():
        children.append(_make_child(child_idx, child_buffer))

    return children
