"""
OpenRouter API Client - untuk agent yang tidak menggunakan Bob
"""
import json
import logging
from typing import Type, TypeVar, Optional

import httpx
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterError(Exception):
    pass


async def chat_completion(
    prompt: str,
    system_prompt: str = "You are a helpful assistant.",
    output_schema: Optional[Type[T]] = None,
    correlation_id: Optional[str] = None,
) -> str | T:
    """
    Call OpenRouter chat completions API.

    If output_schema is provided, instructs the model to return JSON
    and validates/parses the response into that schema.
    """
    log_prefix = f"[{correlation_id}]" if correlation_id else ""

    if not settings.openrouter_api_key:
        raise OpenRouterError("SHERLOCK_OPENROUTER_API_KEY not configured")

    # Build messages
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
    ]

    # If we want structured output, append schema instruction
    if output_schema:
        schema_json = json.dumps(output_schema.model_json_schema(), indent=2)
        messages[0]["content"] += (
            f"\n\nRespond ONLY with a valid JSON object matching this schema:\n{schema_json}"
        )

    payload = {
        "model": settings.openrouter_model,
        "messages": messages,
    }

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sherlock-incident.dev",
        "X-Title": "Sherlock Incident Response",
    }

    logger.info(f"{log_prefix} Calling OpenRouter model={settings.openrouter_model}")

    async with httpx.AsyncClient(timeout=settings.openrouter_timeout) as client:
        resp = await client.post(OPENROUTER_API_URL, json=payload, headers=headers)

    if resp.status_code != 200:
        raise OpenRouterError(f"OpenRouter API error {resp.status_code}: {resp.text}")

    data = resp.json()
    content = data["choices"][0]["message"]["content"]

    if output_schema is None:
        return content

    # Parse JSON response into schema
    try:
        # Extract JSON from possible markdown fences
        text = content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        parsed = json.loads(text)
        return output_schema.model_validate(parsed)
    except Exception as e:
        logger.error(f"{log_prefix} Failed to parse OpenRouter response: {e}")
        raise OpenRouterError(f"Failed to parse response: {e}")
