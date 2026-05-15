"""
Triage Agent - AI-powered incident classification via OpenRouter
"""
import logging
from typing import Optional

from app.models.state import TriageResult, Severity, ErrorType
from app.openrouter_client import chat_completion

logger = logging.getLogger(__name__)

TRIAGE_SYSTEM_PROMPT = """You are an expert incident triage agent. Given a raw alert or error, classify it accurately.

You must respond with a JSON object containing:
- severity: one of "low", "medium", "high", "critical"
- service: the service/component name affected
- error_type: one of "null_pointer", "race_condition", "timeout", "memory_leak", "logic_error", "unknown"
- summary: a concise one-line summary of the incident
- confidence: float 0.0-1.0 indicating your confidence"""


async def triage(raw_alert: str, correlation_id: Optional[str] = None) -> TriageResult:
    """
    AI-powered triage using OpenRouter.

    Args:
        raw_alert: Raw alert text (stack trace, log, JSON, etc)
        correlation_id: Optional ID for tracking

    Returns:
        TriageResult with severity, service, error_type, etc.
    """
    log_prefix = f"[{correlation_id}]" if correlation_id else ""
    logger.info(f"{log_prefix} Starting AI triage analysis")

    prompt = f"Analyze this incident alert and classify it:\n\n{raw_alert}"

    result = await chat_completion(
        prompt=prompt,
        system_prompt=TRIAGE_SYSTEM_PROMPT,
        output_schema=TriageResult,
        correlation_id=correlation_id,
    )

    logger.info(f"{log_prefix} Triage completed: {result.severity.value} / {result.error_type.value}")
    return result
