"""
Bob Analyst Agent - Root cause analysis powered by IBM Bob
"""
import logging
from typing import Optional

from app.models.state import (
    RootCauseAnalysis, SuspectFile, TriageResult, ForensicsResult
)
from app.bob_client import ask_bob

logger = logging.getLogger(__name__)

ANALYST_SYSTEM_PROMPT = """You are IBM Bob, performing root cause analysis on production incidents.
You have full repository context and deep knowledge of common failure patterns: race conditions, null pointers, memory leaks, timeout cascades, and logic errors.
You reason step-by-step, referencing specific code patterns and recent changes to identify the exact root cause."""


class BobAnalystAgent:
    """Agent yang menggunakan IBM Bob untuk deep code analysis"""

    async def analyze(
        self,
        repo_path: str,
        triage_result: TriageResult,
        forensics_result: ForensicsResult,
        correlation_id: Optional[str] = None
    ) -> RootCauseAnalysis:
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        logger.info(f"{log_prefix} Starting analyst (IBM Bob)")

        prompt = self._construct_analysis_prompt(triage_result, forensics_result)

        try:
            result = await ask_bob(
                prompt=prompt,
                repo_path=repo_path,
                output_schema=RootCauseAnalysis,
                system_prompt=ANALYST_SYSTEM_PROMPT,
                correlation_id=correlation_id,
            )
            logger.info(f"{log_prefix} Analysis completed. Confidence: {result.confidence:.2f}")
            return result
        except Exception as e:
            logger.error(f"{log_prefix} Analysis failed: {e}")
            return self._create_fallback_analysis(triage_result, forensics_result)

    def _construct_analysis_prompt(self, triage: TriageResult, forensics: ForensicsResult) -> str:
        commits_text = "\n".join([
            f"- {c.hash} by {c.author} ({c.date.strftime('%Y-%m-%d')}): {c.message}"
            for c in forensics.recent_commits[:5]
        ])
        files_text = "\n".join([f"- {f}" for f in forensics.suspect_files])
        blame_text = "\n".join([
            f"- {b.file_path}:{b.line_number} by {b.author} ({b.commit_hash})"
            for b in forensics.blame_info[:5]
        ])

        return f"""Analyze this production incident and identify the root cause.

## Incident Summary
Severity: {triage.severity.value.upper()}
Error Type: {triage.error_type.value.replace('_', ' ').title()}
Service: {triage.service}
Summary: {triage.summary}

## Recent Changes (Git History)
{commits_text or "No recent commits found"}

## Suspect Files
{files_text or "No suspect files identified"}

## Code Ownership (Git Blame)
{blame_text or "No blame information available"}

## Your Task
Provide:
1. **root_cause**: Specific code-level root cause hypothesis
2. **suspect_files**: Files involved with path, line_number (if known), reason, and confidence (0-1)
3. **reasoning_chain**: Step-by-step reasoning referencing specific code patterns and changes
4. **confidence**: Overall confidence (0.0-1.0)

Be precise and actionable. Reference specific commits, files, and code patterns."""

    def _create_fallback_analysis(self, triage: TriageResult, forensics: ForensicsResult) -> RootCauseAnalysis:
        suspect_files = [
            SuspectFile(path=f, line_number=None, reason="From stack trace", confidence=0.5)
            for f in forensics.suspect_files[:3]
        ]
        reasoning = [
            f"Error type: {triage.error_type.value}",
            f"Service: {triage.service}",
        ]
        if forensics.recent_commits:
            r = forensics.recent_commits[0]
            reasoning.append(f"Recent change by {r.author}: {r.message}")

        return RootCauseAnalysis(
            root_cause=f"{triage.error_type.value.replace('_', ' ')} in {triage.service}. Manual investigation recommended.",
            suspect_files=suspect_files,
            reasoning_chain=reasoning,
            confidence=0.3,
        )


bob_analyst_agent = BobAnalystAgent()


async def analyze(
    repo_path: str,
    triage_result: TriageResult,
    forensics_result: ForensicsResult,
    correlation_id: Optional[str] = None
) -> RootCauseAnalysis:
    return await bob_analyst_agent.analyze(repo_path, triage_result, forensics_result, correlation_id)
