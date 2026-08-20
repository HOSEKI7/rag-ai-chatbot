import pytest
from app.services.prompt_builder import build_rag_prompt, ChatMessage


def test_build_rag_prompt_enforces_citations_and_context_english():
    """Verify prompt builder injects reconstructed context, enforces bracketed citations, and forbids hallucination."""
    query = "What is the rated speed and efficiency class of the Siemens 1LE1 motor?"
    context = (
        "[Citation 1: Siemens 1LE1 Motor Datasheet > Technical Specifications (Page 2)]\n"
        "Rated speed is 1475 RPM with IE3 efficiency rating.\n\n"
        "[Citation 2: Siemens 1LE1 Motor Datasheet > Mechanical Dimensions (Page 5)]\n"
        "Frame size is 160M with cast iron housing."
    )
    history = [
        ChatMessage(role="user", content="Hello, I need information on Siemens motors."),
        ChatMessage(role="assistant", content="Certainly! Please specify the motor model."),
    ]

    system_prompt, user_prompt = build_rag_prompt(
        query=query,
        reconstructed_context=context,
        history=history,
    )

    # Verify system prompt guidelines
    assert "Contexure" in system_prompt
    assert "cite source references as bracketed numbers like [1] or [2]" in system_prompt.lower()
    assert "never invent or extrapolate" in system_prompt.lower()
    assert "language matching" in system_prompt.lower()

    # Verify user prompt packaging
    assert "<conversation_history>" in user_prompt
    assert "User: Hello, I need information on Siemens motors." in user_prompt
    assert "<context>" in user_prompt
    assert context in user_prompt
    assert "<user_query>" in user_prompt
    assert query in user_prompt


def test_build_rag_prompt_multilingual_indonesian_and_german():
    """Verify prompt builder supports Indonesian and German technical queries."""
    context = "[Citation 1: Omron E2E Sensor (Page 3)]\nSensing distance 5mm-10mm, 12V-24V DC."

    # Indonesian query test
    query_id = "Berapa jarak deteksi sensor proximity Omron E2E?"
    _, user_prompt_id = build_rag_prompt(query=query_id, reconstructed_context=context)
    assert query_id in user_prompt_id

    # German query test
    query_de = "Wie groß ist der Schaltabstand des Omron E2E Sensors?"
    _, user_prompt_de = build_rag_prompt(query=query_de, reconstructed_context=context)
    assert query_de in user_prompt_de
