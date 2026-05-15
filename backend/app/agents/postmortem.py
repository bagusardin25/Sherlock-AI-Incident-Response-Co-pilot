"""
Postmortem Agent - AI-generated comprehensive postmortem via OpenRouter
"""
import logging
from typing import Optional

from app.models.state import IncidentState
from app.openrouter_client import chat_completion

logger = logging.getLogger(__name__)

POSTMORTEM_SYSTEM_PROMPT = """You are an expert SRE writing a comprehensive incident postmortem in Markdown.

Given the incident data, produce a well-structured postmortem document with these sections:
1. Executive Summary
2. Timeline
3. Root Cause Analysis
4. Resolution & Fix Applied
5. Impact Assessment
6. Action Items (immediate + follow-up)
7. Lessons Learned

Be specific, actionable, and professional. Use the actual data provided — do not invent facts."""


async def generate(
    incident_state: IncidentState,
    correlation_id: Optional[str] = None,
) -> str:
    """
    Generate AI-powered postmortem using OpenRouter.

    Args:
        incident_state: Complete incident state with all agent results
        correlation_id: Optional ID for tracking

    Returns:
        Postmortem markdown string
    """
    log_prefix = f"[{correlation_id}]" if correlation_id else ""
    logger.info(f"{log_prefix} Generating AI postmortem")

    # Build context from state
    context_parts = [f"Incident ID: {incident_state.incident_id}"]
    context_parts.append(f"Raw Alert:\n{incident_state.raw_input[:1000]}")

    if incident_state.triage:
        t = incident_state.triage
        context_parts.append(
            f"Triage: severity={t.severity.value}, error_type={t.error_type.value}, "
            f"service={t.service}, summary={t.summary}"
        )

    if incident_state.forensics:
        f = incident_state.forensics
        commits = "; ".join(
            f"{c.hash[:7]} by {c.author}: {c.message}"
            for c in f.recent_commits[:5]
        )
        context_parts.append(f"Recent Commits: {commits}")
        context_parts.append(f"Suspect Files: {', '.join(f.suspect_files[:5])}")

    if incident_state.root_cause:
        rc = incident_state.root_cause
        context_parts.append(f"Root Cause: {rc.root_cause}")
        context_parts.append(f"Reasoning: {'; '.join(rc.reasoning_chain)}")
        context_parts.append(f"Confidence: {rc.confidence:.0%}")

    if incident_state.fix:
        fx = incident_state.fix
        context_parts.append(f"Fix PR Title: {fx.pr_title}")
        context_parts.append(f"Files Modified: {', '.join(fx.files_modified)}")
        if fx.patch_unified_diff:
            context_parts.append(f"Patch:\n{fx.patch_unified_diff[:1500]}")

    prompt = "Generate a comprehensive incident postmortem based on this data:\n\n" + "\n\n".join(context_parts)

    result = await chat_completion(
        prompt=prompt,
        system_prompt=POSTMORTEM_SYSTEM_PROMPT,
        correlation_id=correlation_id,
    )

    logger.info(f"{log_prefix} Postmortem generated ({len(result)} chars)")
    return result
