"""
Forensics Agent - Git history analysis + AI-powered suspect identification
"""
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List
import subprocess

from app.models.state import (
    ForensicsResult, CommitInfo, BlameInfo, TriageResult
)
from app.openrouter_client import chat_completion

logger = logging.getLogger(__name__)

FORENSICS_SYSTEM_PROMPT = """You are a forensics investigator analyzing git history to identify the commit that most likely caused a production incident.
You cross-reference stack traces, recent changes, file ownership, and commit messages to find the "smoking gun".
Respond with structured JSON."""


class ForensicsAgent:
    """Agent untuk forensic analysis dari git history + AI reasoning"""

    async def analyze(
        self,
        repo_path: str,
        triage_result: TriageResult,
        correlation_id: Optional[str] = None
    ) -> ForensicsResult:
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        logger.info(f"{log_prefix} Starting forensics analysis on {repo_path}")

        # Step 1: Extract suspect files from error text
        suspect_files = self._extract_suspect_files(triage_result.summary)

        # Step 2: Get git data
        recent_commits = self._get_recent_commits(repo_path, suspect_files, limit=20)
        blame_info = self._get_blame_info(repo_path, suspect_files)
        log_excerpts = self._extract_log_excerpts(triage_result.summary)

        # Step 3: AI reasoning — let LLM analyze the git data and refine suspects
        ai_result = await self._ai_analyze(
            triage_result, recent_commits, blame_info, suspect_files, correlation_id
        )

        # Merge AI-identified suspect files with regex-extracted ones
        if ai_result and ai_result.get("suspect_files"):
            all_suspects = list(set(suspect_files + ai_result["suspect_files"]))
        else:
            all_suspects = suspect_files

        result = ForensicsResult(
            recent_commits=recent_commits,
            blame_info=blame_info,
            log_excerpts=log_excerpts,
            suspect_files=all_suspects[:8],
            timestamp=datetime.utcnow()
        )

        logger.info(f"{log_prefix} Forensics completed: {len(recent_commits)} commits, {len(all_suspects)} suspects")
        return result

    async def _ai_analyze(
        self,
        triage: TriageResult,
        commits: List[CommitInfo],
        blame: List[BlameInfo],
        suspect_files: List[str],
        correlation_id: Optional[str] = None,
    ) -> Optional[dict]:
        """Use AI to reason over git data and identify most likely suspects"""
        if not commits and not suspect_files:
            return None

        commits_text = "\n".join([
            f"- {c.hash} by {c.author} ({c.date.strftime('%Y-%m-%d')}): {c.message} [files: {', '.join(c.files_changed[:3])}]"
            for c in commits[:10]
        ])
        blame_text = "\n".join([
            f"- {b.file_path}:{b.line_number} by {b.author} ({b.commit_hash})"
            for b in blame[:8]
        ])

        prompt = f"""Analyze this git history to identify the most likely commit and files that caused this incident.

## Incident
Severity: {triage.severity.value}
Error: {triage.error_type.value}
Service: {triage.service}
Summary: {triage.summary}

## Recent Commits
{commits_text or "None"}

## Git Blame (suspect areas)
{blame_text or "None"}

## Already Identified Suspect Files
{', '.join(suspect_files) or "None"}

Respond with JSON:
{{"suspect_files": ["path/to/file.ts"], "suspect_commit": "hash", "reasoning": "why this commit is suspicious"}}"""

        try:
            from pydantic import BaseModel

            class ForensicsAI(BaseModel):
                suspect_files: List[str] = []
                suspect_commit: Optional[str] = None
                reasoning: str = ""

            result = await chat_completion(
                prompt=prompt,
                system_prompt=FORENSICS_SYSTEM_PROMPT,
                output_schema=ForensicsAI,
                correlation_id=correlation_id,
            )
            return result.model_dump()
        except Exception as e:
            logger.warning(f"AI forensics reasoning failed (non-fatal): {e}")
            return None

    def _extract_suspect_files(self, error_text: str) -> List[str]:
        """Extract file paths dari error message atau stack trace"""
        files = []
        patterns = [
            r'at\s+([a-zA-Z0-9_/.-]+\.(js|ts|py|java|go|rb|php)):\d+',
            r'File\s+"([^"]+)"',
            r'in\s+([a-zA-Z0-9_/.-]+\.(js|ts|py|java|go|rb|php))',
            r'([a-zA-Z0-9_/.-]+\.(js|ts|py|java|go|rb|php)):\d+:\d+',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, error_text)
            for match in matches:
                file_path = match[0] if isinstance(match, tuple) else match
                if file_path not in files:
                    files.append(file_path)
        return files[:5]

    def _get_recent_commits(self, repo_path: str, suspect_files: List[str], limit: int = 20) -> List[CommitInfo]:
        """Get recent commits, optionally filtered by suspect files"""
        commits = []
        try:
            cmd = ['git', 'log', f'-{limit}', '--pretty=format:%H|%an|%ai|%s', '--name-only']
            if suspect_files:
                cmd.append('--')
                cmd.extend(suspect_files)

            result = subprocess.run(cmd, cwd=repo_path, capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                return commits

            current_commit = None
            files_changed = []

            for line in result.stdout.split('\n'):
                line = line.strip()
                if not line:
                    if current_commit:
                        current_commit['files_changed'] = files_changed
                        commits.append(CommitInfo(**current_commit))
                        current_commit = None
                        files_changed = []
                    continue

                if '|' in line:
                    parts = line.split('|')
                    if len(parts) == 4:
                        commit_hash, author, date_str, message = parts
                        current_commit = {
                            'hash': commit_hash[:8],
                            'author': author,
                            'date': datetime.fromisoformat(date_str.replace(' ', 'T')),
                            'message': message,
                            'files_changed': []
                        }
                else:
                    if current_commit:
                        files_changed.append(line)

            if current_commit:
                current_commit['files_changed'] = files_changed
                commits.append(CommitInfo(**current_commit))

        except subprocess.TimeoutExpired:
            logger.error("Git log timeout")
        except Exception as e:
            logger.error(f"Error getting git commits: {e}")
        return commits

    def _get_blame_info(self, repo_path: str, suspect_files: List[str]) -> List[BlameInfo]:
        """Get git blame info untuk suspect files"""
        blame_entries = []
        for file_path in suspect_files:
            try:
                full_path = Path(repo_path) / file_path
                if not full_path.exists():
                    continue

                cmd = ['git', 'blame', '--line-porcelain', file_path]
                result = subprocess.run(cmd, cwd=repo_path, capture_output=True, text=True, timeout=10)
                if result.returncode != 0:
                    continue

                blame_entries.extend(self._parse_blame_output(result.stdout, file_path, limit=5))
            except subprocess.TimeoutExpired:
                logger.error(f"Git blame timeout for {file_path}")
            except Exception as e:
                logger.error(f"Error getting blame for {file_path}: {e}")
        return blame_entries

    def _parse_blame_output(self, blame_output: str, file_path: str, limit: int = 5) -> List[BlameInfo]:
        """Parse git blame --line-porcelain output"""
        entries = []
        current_entry = {}
        line_number = 0

        for line in blame_output.split('\n'):
            if not line.strip():
                continue
            if line.startswith('\t'):
                line_number += 1
                if current_entry and line_number <= limit:
                    current_entry['line_content'] = line[1:]
                    current_entry['line_number'] = line_number
                    current_entry['file_path'] = file_path
                    try:
                        entries.append(BlameInfo(**current_entry))
                    except Exception:
                        pass
                    current_entry = {}
            else:
                parts = line.split(' ', 1)
                if len(parts) == 2:
                    key, value = parts
                    if key == 'author':
                        current_entry['author'] = value
                    elif key == 'author-time':
                        try:
                            current_entry['commit_date'] = datetime.fromtimestamp(int(value))
                        except:
                            current_entry['commit_date'] = datetime.utcnow()
                    elif len(key) == 40:
                        current_entry['commit_hash'] = key[:8]
        return entries[:limit]

    def _extract_log_excerpts(self, error_text: str) -> List[str]:
        """Extract relevant log excerpts"""
        lines = [line.strip() for line in error_text.split('\n') if line.strip()]
        return [line for line in lines[:10] if len(line) > 20]


forensics_agent = ForensicsAgent()


async def analyze(
    repo_path: str,
    triage_result: TriageResult,
    correlation_id: Optional[str] = None
) -> ForensicsResult:
    return await forensics_agent.analyze(repo_path, triage_result, correlation_id)
