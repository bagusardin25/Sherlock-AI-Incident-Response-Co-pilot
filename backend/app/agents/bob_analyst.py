"""
Bob Agent - Hero agent yang menggunakan IBM Bob untuk root cause analysis
"""
import logging
from typing import Optional

from app.models.state import (
    RootCauseAnalysis, SuspectFile, TriageResult, ForensicsResult
)
from app.bob_client import ask_bob

logger = logging.getLogger(__name__)


class BobAnalystAgent:
    """Agent yang menggunakan Bob CLI untuk deep code analysis"""
    
    def __init__(self):
        """Initialize Bob Analyst Agent"""
        pass
    
    async def analyze(
        self,
        repo_path: str,
        triage_result: TriageResult,
        forensics_result: ForensicsResult,
        correlation_id: Optional[str] = None
    ) -> RootCauseAnalysis:
        """
        Analyze incident menggunakan Bob dengan full repo context.
        
        Args:
            repo_path: Path ke repository
            triage_result: Result dari triage agent
            forensics_result: Result dari forensics agent
            correlation_id: Optional ID untuk tracking
            
        Returns:
            RootCauseAnalysis dengan hypothesis, suspect files, reasoning
        """
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        logger.info(f"{log_prefix} Starting Bob analysis")
        
        # Construct comprehensive prompt untuk Bob
        prompt = self._construct_analysis_prompt(
            triage_result,
            forensics_result
        )
        
        logger.debug(f"{log_prefix} Prompt length: {len(prompt)} chars")
        
        try:
            # Call Bob dengan structured output
            result = await ask_bob(
                prompt=prompt,
                repo_path=repo_path,
                output_schema=RootCauseAnalysis,
                correlation_id=correlation_id
            )
            
            logger.info(
                f"{log_prefix} Bob analysis completed. "
                f"Confidence: {result.confidence:.2f}, "
                f"Suspect files: {len(result.suspect_files)}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"{log_prefix} Bob analysis failed: {e}")
            # Return graceful degraded response
            return self._create_fallback_analysis(triage_result, forensics_result)
    
    def _construct_analysis_prompt(
        self,
        triage: TriageResult,
        forensics: ForensicsResult
    ) -> str:
        """Construct detailed prompt untuk Bob analysis"""
        
        # Format recent commits
        commits_text = "\n".join([
            f"- {c.hash} by {c.author} ({c.date.strftime('%Y-%m-%d')}): {c.message}"
            for c in forensics.recent_commits[:5]
        ])
        
        # Format suspect files
        files_text = "\n".join([f"- {f}" for f in forensics.suspect_files])
        
        # Format blame info
        blame_text = "\n".join([
            f"- {b.file_path}:{b.line_number} by {b.author} ({b.commit_hash})"
            for b in forensics.blame_info[:5]
        ])
        
        prompt = f"""You are analyzing a production incident. Your task is to identify the root cause with full repository context.

## Incident Summary
Severity: {triage.severity.value.upper()}
Error Type: {triage.error_type.value.replace('_', ' ').title()}
Service: {triage.service}
Summary: {triage.summary}

## Recent Changes (Git History)
{commits_text if commits_text else "No recent commits found"}

## Suspect Files
{files_text if files_text else "No suspect files identified"}

## Code Ownership (Git Blame)
{blame_text if blame_text else "No blame information available"}

## Your Task
Analyze the codebase with full context and provide:

1. **Root Cause Hypothesis**: What is the most likely root cause of this incident? Be specific about the code-level issue.

2. **Suspect Files**: List the files that are most likely involved in causing this issue, with specific line numbers if possible.

3. **Reasoning Chain**: Provide step-by-step reasoning that led you to this conclusion. Reference specific code patterns, recent changes, or architectural issues.

4. **Confidence**: Rate your confidence in this analysis (0.0 to 1.0).

Focus on:
- Code-level issues (logic errors, race conditions, null pointers, etc.)
- Recent changes that might have introduced the bug
- Architectural patterns that might be problematic
- Dependencies or external factors

Be precise and actionable. Your analysis will be used to generate a fix.
"""
        
        return prompt
    
    def _create_fallback_analysis(
        self,
        triage: TriageResult,
        forensics: ForensicsResult
    ) -> RootCauseAnalysis:
        """Create fallback analysis jika Bob gagal"""
        
        # Create basic suspect files dari forensics
        suspect_files = [
            SuspectFile(
                path=file_path,
                line_number=None,
                reason="Identified from error stack trace",
                confidence=0.5
            )
            for file_path in forensics.suspect_files[:3]
        ]
        
        # Basic reasoning
        reasoning = [
            f"Error type detected: {triage.error_type.value}",
            f"Severity level: {triage.severity.value}",
            f"Service affected: {triage.service}",
        ]
        
        if forensics.recent_commits:
            recent = forensics.recent_commits[0]
            reasoning.append(
                f"Most recent change by {recent.author}: {recent.message}"
            )
        
        root_cause = (
            f"Based on automated analysis: {triage.error_type.value.replace('_', ' ')} "
            f"detected in {triage.service}. Manual investigation recommended."
        )
        
        return RootCauseAnalysis(
            root_cause=root_cause,
            suspect_files=suspect_files,
            reasoning_chain=reasoning,
            confidence=0.3  # Low confidence untuk fallback
        )


# Global instance
bob_analyst_agent = BobAnalystAgent()


async def analyze(
    repo_path: str,
    triage_result: TriageResult,
    forensics_result: ForensicsResult,
    correlation_id: Optional[str] = None
) -> RootCauseAnalysis:
    """
    Convenience function untuk Bob analysis.
    
    Usage:
        result = await analyze("/path/to/repo", triage_result, forensics_result)
    """
    return await bob_analyst_agent.analyze(
        repo_path,
        triage_result,
        forensics_result,
        correlation_id
    )
