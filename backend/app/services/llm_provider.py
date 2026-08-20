import json
import logging
from typing import AsyncGenerator, Optional
import httpx
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger(__name__)


class StreamToken(BaseModel):
    token: str
    provider: str


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
        Streams generated answer tokens. Tries Gemini primary first; seamlessly fails over to Groq.
        """
        gemini_error: Optional[Exception] = None

        # 1. Try Primary Provider: Google Gemini
        if self.gemini_api_key:
            try:
                has_yielded = False
                async for token_item in self._stream_gemini(system_prompt, user_prompt):
                    has_yielded = True
                    yield token_item
                if has_yielded:
                    return
            except Exception as e:
                logger.warning(f"Primary provider (Gemini) failed: {e}. Attempting fallback to Groq...")
                gemini_error = e

        # 2. Try Fallback Provider: Groq Cloud Llama 3.3 70B
        if self.groq_api_key:
            try:
                has_yielded = False
                async for token_item in self._stream_groq(system_prompt, user_prompt):
                    has_yielded = True
                    yield token_item
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"Fallback provider (Groq) failed: {e}")

        # 3. Development / Test Fallback
        if not self.gemini_api_key and not self.groq_api_key:
            async for token_item in self._stream_local_dev(user_prompt):
                yield token_item
            return

        # If keys were present but both failed
        raise RuntimeError(f"All LLM generation providers failed. Gemini: {gemini_error}")

    async def _stream_gemini(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AsyncGenerator[StreamToken, None]:
        """Calls Google Gemini API with SSE streaming."""
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:streamGenerateContent"
            f"?key={self.gemini_api_key}&alt=sse"
        )

        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": user_prompt}]}
            ],
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "generation_config": {
                "temperature": 0.2,
                "max_output_tokens": 2048,
            },
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    raise RuntimeError(f"Gemini API returned status {response.status_code}: {err_body.decode('utf-8')}")

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        continue

                    json_str = line[len("data: "):].strip()
                    if not json_str:
                        continue

                    try:
                        data = json.loads(json_str)
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                text_piece = part.get("text", "")
                                if text_piece:
                                    yield StreamToken(token=text_piece, provider="gemini")
                    except json.JSONDecodeError:
                        continue

    async def _stream_groq(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AsyncGenerator[StreamToken, None]:
        """Calls Groq Cloud API with OpenAI-compatible SSE streaming."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.groq_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 2048,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    raise RuntimeError(f"Groq API returned status {response.status_code}: {err_body.decode('utf-8')}")

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        continue

                    data_str = line[len("data: "):].strip()
                    if data_str == "[DONE]":
                        break

                    try:
                        data = json.loads(data_str)
                        choices = data.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield StreamToken(token=content, provider="groq_fallback")
                    except json.JSONDecodeError:
                        continue

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
