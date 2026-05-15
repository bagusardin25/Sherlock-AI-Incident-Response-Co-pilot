"""
Fix Agent - Generate code patch dan test powered by IBM Bob
"""
import logging
from typing import Optional

from app.models.state import (
    FixProposal, RootCauseAnalysis, TriageResult, ForensicsResult
)
from app.bob_client import ask_bob

logger = logging.getLogger(__name__)

FIX_SYSTEM_PROMPT = """You are IBM Bob, generating production-ready code fixes with full repository context.
You write minimal, focused patches that address the root cause without introducing new issues.
You follow existing code style, add proper error handling, and include regression tests when possible.
Your patches are in unified diff format, applicable with `git apply`."""


class FixAgent:
    """Agent yang menggunakan IBM Bob untuk generate code fix"""

    async def generate_fix(
        self,
        repo_path: str,
        triage_result: TriageResult,
        forensics_result: ForensicsResult,
        root_cause: RootCauseAnalysis,
        correlation_id: Optional[str] = None
    ) -> FixProposal:
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        logger.info(f"{log_prefix} Starting fix generation (IBM Bob)")

        prompt = self._construct_fix_prompt(triage_result, forensics_result, root_cause)

        try:
            result = await ask_bob(
                prompt=prompt,
                repo_path=repo_path,
                output_schema=FixProposal,
                system_prompt=FIX_SYSTEM_PROMPT,
                correlation_id=correlation_id,
            )
            logger.info(f"{log_prefix} Fix generated. Files modified: {len(result.files_modified)}")
            return result
        except Exception as e:
            logger.error(f"{log_prefix} Fix generation failed: {e}")
            return self._create_fallback_fix(root_cause)

    def _construct_fix_prompt(
        self, triage: TriageResult, forensics: ForensicsResult, root_cause: RootCauseAnalysis
    ) -> str:
        suspect_files_text = "\n".join([
            f"- {sf.path}" + (f" (line {sf.line_number})" if sf.line_number else "") + f": {sf.reason}"
            for sf in root_cause.suspect_files
        ])
        reasoning_text = "\n".join([f"{i+1}. {r}" for i, r in enumerate(root_cause.reasoning_chain)])

        return f"""Generate a production-ready code fix for this incident.

## Incident Context
Severity: {triage.severity.value.upper()}
Error Type: {triage.error_type.value.replace('_', ' ').title()}
Service: {triage.service}

## Root Cause
{root_cause.root_cause}

## Suspect Files
{suspect_files_text}

## Reasoning
{reasoning_text}

## Required Output
1. **patch_unified_diff**: Unified diff patch fixing the root cause (with 3 lines context)
2. **test_code**: A regression test that would catch this bug (or null if not applicable)
3. **pr_title**: Concise PR title in conventional commit format (e.g. "fix: await inventory fetch")
4. **pr_body**: PR description with problem, fix, and verification steps
5. **files_modified**: List of file paths modified

Requirements:
- Minimal, focused fix — only change what's necessary
- Follow existing code patterns
- Add error handling where appropriate
- The patch must be syntactically valid unified diff"""

    def _create_fallback_fix(self, root_cause: RootCauseAnalysis) -> FixProposal:
        first_suspect = root_cause.suspect_files[0] if root_cause.suspect_files else None
        file_path = first_suspect.path if first_suspect else "unknown"
        files_modified = [file_path] if first_suspect else []

        patch = f"""--- a/{file_path}
+++ b/{file_path}
@@ -1,3 +1,4 @@
+// TODO: Fix required - {root_cause.root_cause}
 // Automated fix generation failed
 // Manual intervention required
"""
        return FixProposal(
            patch_unified_diff=patch,
            test_code=None,
            pr_title=f"fix: address {root_cause.root_cause[:50]}",
            pr_body=f"## Problem\n{root_cause.root_cause}\n\n## Action Required\nManual fix needed.",
            files_modified=files_modified,
        )


fix_agent = FixAgent()


async def generate_fix(
    repo_path: str,
    triage_result: TriageResult,
    forensics_result: ForensicsResult,
    root_cause: RootCauseAnalysis,
    correlation_id: Optional[str] = None
) -> FixProposal:
    return await fix_agent.generate_fix(repo_path, triage_result, forensics_result, root_cause, correlation_id)
