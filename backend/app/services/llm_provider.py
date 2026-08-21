import json
import logging
from typing import AsyncGenerator, Optional, Callable, Any, Dict
import httpx
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger(__name__)


class StreamToken(BaseModel):
    token: str
    provider: str


async def _parse_sse_lines(
    client: httpx.AsyncClient,
    url: str,
    headers: Dict[str, str],
    payload: Dict[str, Any],
    extract_token_fn: Callable[[Dict[str, Any]], Optional[str]],
    provider_name: str,
) -> AsyncGenerator[StreamToken, None]:
    """Reusable helper for streaming and parsing Server-Sent Events (SSE) from REST APIs."""
    async with client.stream("POST", url, json=payload, headers=headers) as response:
        if response.status_code != 200:
            err_body = await response.aread()
            raise RuntimeError(
                f"{provider_name} API returned status {response.status_code}: {err_body.decode('utf-8')}"
            )

        async for line in response.aiter_lines():
            line = line.strip()
            if not line or not line.startswith("data: "):
                continue

            data_str = line[len("data: "):].strip()
            if data_str == "[DONE]":
                break

            try:
                data = json.loads(data_str)
                token = extract_token_fn(data)
                if token:
                    yield StreamToken(token=token, provider=provider_name)
            except json.JSONDecodeError:
                continue


class LLMProviderService:
    """
    Multi-provider streaming generation service:
    - Primary: Google Gemini 2.5 Flash API
    - Automatic Fallback: Groq Cloud Llama 3.3 70B API
    - Local Dev / Test fallback when no cloud keys are configured
    """

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        groq_api_key: Optional[str] = None,
        gemini_model: Optional[str] = None,
        groq_model: Optional[str] = None,
    ):
        self.gemini_api_key = gemini_api_key if gemini_api_key is not None else settings.GEMINI_API_KEY
        self.groq_api_key = groq_api_key if groq_api_key is not None else settings.GROQ_API_KEY
        self.gemini_model = gemini_model or settings.GEMINI_MODEL
        self.groq_model = groq_model or settings.GROQ_MODEL

    async def stream_generation(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AsyncGenerator[StreamToken, None]:
        """
        Streams generated answer tokens. Tries Gemini primary first; seamlessly fails over to Groq
        if Gemini encounters rate limits or errors prior to yielding tokens.
        """
        has_yielded = False
        gemini_error: Optional[Exception] = None

        # 1. Try Primary Provider: Google Gemini
        if self.gemini_api_key:
            try:
                async for token_item in self._stream_gemini(system_prompt, user_prompt):
                    has_yielded = True
                    yield token_item
                if has_yielded:
                    return
            except Exception as e:
                gemini_error = e
                # Only attempt fallback if no tokens were emitted to prevent duplicate content
                if has_yielded:
                    logger.error(f"Gemini failed mid-stream after emitting tokens: {e}")
                    raise
                logger.warning(f"Primary provider (Gemini) failed: {e}. Attempting fallback to Groq...")

        # 2. Try Fallback Provider: Groq Cloud Llama 3.3 70B
        if self.groq_api_key and not has_yielded:
            try:
                async for token_item in self._stream_groq(system_prompt, user_prompt):
                    has_yielded = True
                    yield token_item
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"Fallback provider (Groq) failed: {e}")

        # 3. Development / Offline Fallback
        if not self.gemini_api_key and not self.groq_api_key:
            async for token_item in self._stream_local_dev(user_prompt):
                yield token_item
            return

        if not has_yielded:
            raise RuntimeError(f"All LLM generation providers failed. Gemini: {gemini_error}")

    async def _stream_gemini(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AsyncGenerator[StreamToken, None]:
        """Calls Google Gemini API with SSE streaming and automatic model retry."""
        candidate_models = [self.gemini_model]
        for fallback in [
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.7-flash",
            "gemini-flash-latest",
            "gemini-1.5-flash",
        ]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        last_err: Optional[Exception] = None
        has_emitted = False

        for model in candidate_models:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent"
                f"?key={self.gemini_api_key}&alt=sse"
            )
            payload = {
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "generation_config": {"temperature": 0.2, "max_output_tokens": 2048},
            }

            def _extract_gemini_token(data: Dict[str, Any]) -> Optional[str]:
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        txt = part.get("text")
                        if txt:
                            return txt
                return None

            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    async for token in _parse_sse_lines(
                        client=client,
                        url=url,
                        headers={},
                        payload=payload,
                        extract_token_fn=_extract_gemini_token,
                        provider_name="gemini",
                    ):
                        has_emitted = True
                        yield token
                if has_emitted:
                    return
            except Exception as e:
                last_err = e
                if has_emitted:
                    raise
                logger.warning(f"Gemini model {model} failed: {e}. Trying next candidate model...")

        if last_err:
            raise last_err

    async def _stream_groq(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AsyncGenerator[StreamToken, None]:
        """Calls Groq Cloud API with OpenAI-compatible SSE streaming and automatic model retry."""
        candidate_models = [self.groq_model]
        for fallback in [
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "qwen/qwen3.6-27b",
            "groq/compound",
            "llama-3.3-70b-versatile",
        ]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        last_err: Optional[Exception] = None
        has_emitted = False

        for model in candidate_models:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 2048,
                "stream": True,
            }

            def _extract_groq_token(data: Dict[str, Any]) -> Optional[str]:
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("delta", {}).get("content")
                return None

            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    async for token in _parse_sse_lines(
                        client=client,
                        url=url,
                        headers=headers,
                        payload=payload,
                        extract_token_fn=_extract_groq_token,
                        provider_name="groq_fallback",
                    ):
                        has_emitted = True
                        yield token
                if has_emitted:
                    return
            except Exception as e:
                last_err = e
                if has_emitted:
                    raise
                logger.warning(f"Groq model {model} failed: {e}. Trying next candidate model...")

        if last_err:
            raise last_err


    async def _stream_local_dev(self, user_prompt: str) -> AsyncGenerator[StreamToken, None]:
        """Synthetic local generator for testing and offline development."""
        mock_response = (
            "Based on the verified technical documentation [1], the specified equipment operating parameters "
            "and electrical ratings are verified. Please check the accompanying citation blocks for exact pinouts [1]."
        )
        words = mock_response.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield StreamToken(token=token, provider="local_mock")


_llm_provider_instance: Optional[LLMProviderService] = None


def get_llm_provider() -> LLMProviderService:
    """Returns cached singleton instance of LLMProviderService."""
    global _llm_provider_instance
    if _llm_provider_instance is None:
        _llm_provider_instance = LLMProviderService()
    return _llm_provider_instance
