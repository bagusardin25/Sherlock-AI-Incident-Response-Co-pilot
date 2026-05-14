"""
Fix Agent - Generate code patch dan test menggunakan Bob
"""
import logging
from typing import Optional

from app.models.state import (
    FixProposal, RootCauseAnalysis, TriageResult, ForensicsResult
)
from app.bob_client import ask_bob

logger = logging.getLogger(__name__)


class FixAgent:
    """Agent yang menggunakan Bob untuk generate code fix"""
    
    def __init__(self):
        """Initialize Fix Agent"""
        pass
    
    async def generate_fix(
        self,
        repo_path: str,
        triage_result: TriageResult,
        forensics_result: ForensicsResult,
        root_cause: RootCauseAnalysis,
        correlation_id: Optional[str] = None
    ) -> FixProposal:
        """
        Generate code fix menggunakan Bob.
        
        Args:
            repo_path: Path ke repository
            triage_result: Result dari triage agent
            forensics_result: Result dari forensics agent
            root_cause: Result dari Bob analyst agent
            correlation_id: Optional ID untuk tracking
            
        Returns:
            FixProposal dengan patch, test, PR description
        """
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        logger.info(f"{log_prefix} Starting fix generation")
        
        # Construct prompt untuk Bob
        prompt = self._construct_fix_prompt(
            triage_result,
            forensics_result,
            root_cause
        )
        
        logger.debug(f"{log_prefix} Fix prompt length: {len(prompt)} chars")
        
        try:
            # Call Bob untuk generate fix
            result = await ask_bob(
                prompt=prompt,
                repo_path=repo_path,
                output_schema=FixProposal,
                correlation_id=correlation_id
            )
            
            logger.info(
                f"{log_prefix} Fix generation completed. "
                f"Files modified: {len(result.files_modified)}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"{log_prefix} Fix generation failed: {e}")
            # Return fallback fix proposal
            return self._create_fallback_fix(root_cause)
    
    def _construct_fix_prompt(
        self,
        triage: TriageResult,
        forensics: ForensicsResult,
        root_cause: RootCauseAnalysis
    ) -> str:
        """Construct prompt untuk fix generation"""
        
        # Format suspect files dengan details
        suspect_files_text = "\n".join([
            f"- {sf.path}" + (f" (line {sf.line_number})" if sf.line_number else "") + 
            f": {sf.reason}"
            for sf in root_cause.suspect_files
        ])
        
        # Format reasoning chain
        reasoning_text = "\n".join([
            f"{i+1}. {reason}"
            for i, reason in enumerate(root_cause.reasoning_chain)
        ])
        
        prompt = f"""You are tasked with generating a code fix for a production incident.

## Incident Context
Severity: {triage.severity.value.upper()}
Error Type: {triage.error_type.value.replace('_', ' ').title()}
Service: {triage.service}

## Root Cause Analysis
{root_cause.root_cause}

## Suspect Files
{suspect_files_text}

## Reasoning Chain
{reasoning_text}

## Your Task
Generate a complete fix for this incident including:

1. **Unified Diff Patch**: Generate a unified diff format patch that fixes the root cause. Include proper context lines (3 lines before and after changes). The patch should be applicable with `git apply` or `patch` command.

2. **Test Code** (optional but recommended): Write a test case that would have caught this bug. Include the test framework setup if needed.

3. **PR Title**: Write a concise, descriptive PR title following conventional commit format (e.g., "fix: prevent null pointer in checkout flow").

4. **PR Body**: Write a comprehensive PR description including:
   - What was the problem?
   - What is the fix?
   - How to verify the fix?
   - Any breaking changes or migration notes?

5. **Files Modified**: List all files that will be modified by this patch.

Requirements:
- The fix should be minimal and focused on the root cause
- Follow the existing code style and patterns in the repository
- Add appropriate error handling
- Include comments explaining the fix if the logic is complex
- Ensure the fix doesn't introduce new issues

Be precise and production-ready. This fix will be reviewed and potentially deployed.
"""
        
        return prompt
    
    def _create_fallback_fix(
        self,
        root_cause: RootCauseAnalysis
    ) -> FixProposal:
        """Create fallback fix proposal jika Bob gagal"""
        
        # Extract first suspect file
        first_suspect = root_cause.suspect_files[0] if root_cause.suspect_files else None
        
        if first_suspect:
            file_path = first_suspect.path
            files_modified = [file_path]
            
            patch = f"""--- a/{file_path}
+++ b/{file_path}
@@ -1,3 +1,4 @@
+// TODO: Fix required - {root_cause.root_cause}
 // Automated fix generation failed
 // Manual intervention required
 // See root cause analysis for details
"""
        else:
            files_modified = []
            patch = "# Automated fix generation failed - manual intervention required"
        
        pr_title = f"fix: address {root_cause.root_cause[:50]}..."
        
        pr_body = f"""## Problem
{root_cause.root_cause}

## Root Cause Analysis
{"".join([f"- {r}\n" for r in root_cause.reasoning_chain])}

## Fix
⚠️ Automated fix generation was not successful. Manual code review and fix required.

## Suspect Files
{"".join([f"- {sf.path}\n" for sf in root_cause.suspect_files])}

## Action Required
Please review the root cause analysis and implement an appropriate fix.
"""
        
        return FixProposal(
            patch_unified_diff=patch,
            test_code=None,
            pr_title=pr_title,
            pr_body=pr_body,
            files_modified=files_modified
        )


# Global instance
fix_agent = FixAgent()


async def generate_fix(
    repo_path: str,
    triage_result: TriageResult,
    forensics_result: ForensicsResult,
    root_cause: RootCauseAnalysis,
    correlation_id: Optional[str] = None
) -> FixProposal:
    """
    Convenience function untuk fix generation.
    
    Usage:
        result = await generate_fix(
            "/path/to/repo",
            triage_result,
            forensics_result,
            root_cause
        )
    """
    return await fix_agent.generate_fix(
        repo_path,
        triage_result,
        forensics_result,
        root_cause,
        correlation_id
    )
