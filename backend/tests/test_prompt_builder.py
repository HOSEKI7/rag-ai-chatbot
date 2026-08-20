import pytest
from app.services.prompt_builder import build_rag_prompt, SYSTEM_PROMPT_TEMPLATE


def test_build_rag_prompt_enforces_citations_and_context():
    """Verify prompt builder injects reconstructed context, enforces bracketed citations, and forbids hallucination."""
    query = "What is the rated speed and efficiency class of the Siemens 1LE1 motor?"
    context = (
        "[Citation 1: Siemens 1LE1 Motor Datasheet > Technical Specifications (Page 2)]\n"
        "Rated speed is 1475 RPM with IE3 efficiency rating.\n\n"
        "[Citation 2: Siemens 1LE1 Motor Datasheet > Mechanical Dimensions (Page 5)]\n"
        "Frame size is 160M with cast iron housing."
    )

    system_prompt, user_prompt = build_rag_prompt(
        query=query,
        reconstructed_context=context,
    )

    # Verify system prompt guidelines
    assert "Contexure" in system_prompt
    assert "cite source references as bracketed numbers like [1] or [2]" in system_prompt.lower()
    assert "never invent or extrapolate" in system_prompt.lower()
    assert "respond in the same language" in system_prompt.lower()

    # Verify user prompt packaging
    assert "<context>" in user_prompt
    assert context in user_prompt
    assert "<user_query>" in user_prompt
    assert query in user_prompt
