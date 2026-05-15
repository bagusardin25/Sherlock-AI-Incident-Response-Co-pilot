"""
IBM Bob API Client - Interface untuk memanggil IBM Bob via HTTP API
"""
import json
import logging
from pathlib import Path
from typing import TypeVar, Type, Optional

import httpx
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)


class BobError(Exception):
    """Base exception untuk Bob-related errors"""
    pass


class BobTimeoutError(BobError):
    """Raised ketika Bob API timeout"""
    pass


class BobParseError(BobError):
    """Raised ketika Bob output tidak bisa di-parse"""
    pass


class BobClient:
    """Client untuk berinteraksi dengan IBM Bob API"""

    def __init__(self):
        self.api_url = settings.bob_api_url
        self.api_key = settings.bob_api_key
        self.model = settings.bob_model
        self.timeout = settings.bob_timeout
        self.mock_mode = settings.bob_mock_mode
        self.fixtures_path = Path(settings.fixtures_path) / "bob_responses"

    async def ask_bob(
        self,
        prompt: str,
        repo_path: str,
        output_schema: Type[T],
        system_prompt: str = "You are IBM Bob, an AI assistant with deep repository understanding.",
        correlation_id: Optional[str] = None
    ) -> T:
        """
        Call IBM Bob API with prompt and parse response into schema.

        In mock mode, returns canned fixture responses.
        """
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        logger.info(f"{log_prefix} Calling IBM Bob (model={self.model}, schema={output_schema.__name__})")

        if self.mock_mode:
            logger.info(f"{log_prefix} Mock mode — returning canned response")
            return await self._get_mock_response(output_schema, correlation_id)

        if not self.api_key:
            raise BobError("SHERLOCK_BOB_API_KEY not configured")

        # Build messages with schema instruction
        schema_json = json.dumps(output_schema.model_json_schema(), indent=2)
        messages = [
            {
                "role": "system",
                "content": (
                    f"{system_prompt}\n\n"
                    f"Respond ONLY with a valid JSON object matching this schema:\n{schema_json}"
                ),
            },
            {"role": "user", "content": prompt},
        ]

        payload = {
            "model": self.model,
            "messages": messages,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(self.api_url, json=payload, headers=headers)

            if resp.status_code != 200:
                raise BobError(f"IBM Bob API error {resp.status_code}: {resp.text}")

            content = resp.json()["choices"][0]["message"]["content"]
            return self._parse_response(content, output_schema, correlation_id)

        except httpx.TimeoutException:
            logger.error(f"{log_prefix} IBM Bob API timeout after {self.timeout}s")
            raise BobTimeoutError(f"IBM Bob API timeout after {self.timeout}s")
        except BobError:
            raise
        except Exception as e:
            logger.error(f"{log_prefix} Unexpected error calling IBM Bob: {e}")
            raise BobError(f"Error calling IBM Bob: {e}")

    def _parse_response(self, content: str, schema: Type[T], correlation_id: Optional[str] = None) -> T:
        """Parse JSON response from Bob into the target schema."""
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        text = content.strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        try:
            parsed = json.loads(text)
            result = schema.model_validate(parsed)
            logger.info(f"{log_prefix} Successfully parsed IBM Bob response")
            return result
        except Exception as e:
            logger.error(f"{log_prefix} Failed to parse IBM Bob response: {e}")
            raise BobParseError(f"Failed to parse IBM Bob response: {e}")

    async def _get_mock_response(self, schema: Type[T], correlation_id: Optional[str] = None) -> T:
        """Return canned fixture response for mock/demo mode."""
        fixture_map = {
            "RootCauseAnalysis": "root_cause_analysis.json",
            "FixProposal": "fix_proposal.json",
        }
        fixture_file = fixture_map.get(schema.__name__)
        if not fixture_file:
            return schema.model_validate({})

        fixture_path = self.fixtures_path / fixture_file
        if not fixture_path.exists():
            return schema.model_validate({})

        with open(fixture_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return schema.model_validate(data)


# Global client instance
bob_client = BobClient()


async def ask_bob(
    prompt: str,
    repo_path: str,
    output_schema: Type[T],
    system_prompt: str = "You are IBM Bob, an AI assistant with deep repository understanding.",
    correlation_id: Optional[str] = None
) -> T:
    """Convenience function to call IBM Bob."""
    return await bob_client.ask_bob(prompt, repo_path, output_schema, system_prompt, correlation_id)
