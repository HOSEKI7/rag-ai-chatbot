import pytest
from app.services.llm_provider import LLMProviderService, StreamToken


@pytest.mark.asyncio
async def test_llm_provider_fallback_when_gemini_fails(monkeypatch):
    """Verify provider fallback switches to Groq when Gemini returns 429 or error."""
    service = LLMProviderService(
        gemini_api_key="test_gemini_key",
        groq_api_key="test_groq_key",
    )

    # Simulate Gemini failing with a 429 RateLimit error
    async def mock_gemini_stream(*args, **kwargs):
        raise RuntimeError("Google Gemini API Error: 429 Resource Exhausted")
        yield  # make it an async generator

    # Simulate Groq succeeding
    async def mock_groq_stream(*args, **kwargs):
        yield StreamToken(token="The ", provider="groq_fallback")
        yield StreamToken(token="rated speed is 1475 RPM.", provider="groq_fallback")

    monkeypatch.setattr(service, "_stream_gemini", mock_gemini_stream)
    monkeypatch.setattr(service, "_stream_groq", mock_groq_stream)

    tokens = []
    providers = set()
    async for item in service.stream_generation(system_prompt="sys", user_prompt="usr"):
        tokens.append(item.token)
        providers.add(item.provider)

    assert "".join(tokens) == "The rated speed is 1475 RPM."
    assert "groq_fallback" in providers


@pytest.mark.asyncio
async def test_llm_provider_primary_gemini_success(monkeypatch):
    """Verify provider uses Gemini when Gemini returns successful stream."""
    service = LLMProviderService(
        gemini_api_key="test_gemini_key",
        groq_api_key="test_groq_key",
    )

    async def mock_gemini_stream(*args, **kwargs):
        yield StreamToken(token="Siemens 1LE1 ", provider="gemini")
        yield StreamToken(token="15 kW [1].", provider="gemini")

    monkeypatch.setattr(service, "_stream_gemini", mock_gemini_stream)

    tokens = []
    async for item in service.stream_generation(system_prompt="sys", user_prompt="usr"):
        tokens.append(item.token)

    assert "".join(tokens) == "Siemens 1LE1 15 kW [1]."


@pytest.mark.asyncio
async def test_llm_provider_local_dev_fallback_when_no_keys():
    """Verify local dev fallback yields helpful mock response when no API keys are provided."""
    service = LLMProviderService(gemini_api_key="", groq_api_key="")
    tokens = []
    async for item in service.stream_generation(system_prompt="sys", user_prompt="usr"):
        tokens.append(item.token)

    full_text = "".join(tokens)
    assert len(full_text) > 0
    assert "[1]" in full_text
