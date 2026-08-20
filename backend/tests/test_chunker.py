import pytest
from app.services.chunker import (
    chunk_document_structure_aware,
    ChildChunk,
    ParentChunk,
)


def test_structure_aware_chunking_with_sections_and_tables():
    markdown_content = """# Siemens 1LE1 AC Motor Datasheet

The Siemens 1LE1 is a standard induction motor designed for harsh industrial applications.

## Technical Specifications

| Parameter | Value |
|---|---|
| Rated Output | 15 kW |
| Rated Speed | 1475 RPM |
| Rated Torque | 97 Nm |
| Efficiency Class | IE3 |

## Electrical Characteristics

The operating voltage range is 380V to 420V with a rated frequency of 50 Hz.
Protection class is IP55 standard, upgradeable to IP65 for outdoor pump stations.

## Mechanical Dimensions

Frame size 160M with cast iron housing and flange mounting option B5.
"""

    document_id = "doc-siemens-1le1"
    document_title = "Siemens 1LE1 Datasheet"

    parents, children = chunk_document_structure_aware(
        text=markdown_content,
        document_id=document_id,
        document_title=document_title,
        category="Motor",
        max_parent_tokens=500,
        max_child_tokens=100,
    )

    # Verify parent chunks
    assert len(parents) >= 1
    for parent in parents:
        assert isinstance(parent, ParentChunk)
        assert parent.document_id == document_id
        assert parent.category == "Motor"
        assert parent.token_count > 0
        assert len(parent.text) > 0

    # Verify child chunks
    assert len(children) >= len(parents)
    parent_ids = {p.id for p in parents}
    for child in children:
        assert isinstance(child, ChildChunk)
        assert child.document_id == document_id
        assert child.category == "Motor"
        assert child.parent_id in parent_ids
        assert child.token_count <= 200
        assert len(child.text) > 0
