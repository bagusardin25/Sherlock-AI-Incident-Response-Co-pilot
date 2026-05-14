"""
Forensics Agent - Mengumpulkan context dari git history dan logs
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

logger = logging.getLogger(__name__)


class ForensicsAgent:
    """Agent untuk forensic analysis dari git history dan logs"""
    
    def __init__(self):
        """Initialize Forensics Agent"""
        pass
    
    def analyze(
        self,
        repo_path: str,
        triage_result: TriageResult,
        correlation_id: Optional[str] = None
    ) -> ForensicsResult:
        """
        Analyze git history dan logs untuk gather context.
        
        Args:
            repo_path: Path ke repository
            triage_result: Result dari triage agent
            correlation_id: Optional ID untuk tracking
            
        Returns:
            ForensicsResult dengan commits, blame info, logs
        """
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        logger.info(f"{log_prefix} Starting forensics analysis on {repo_path}")
        
        # Get suspect files dari error message
        suspect_files = self._extract_suspect_files(triage_result.summary)
        logger.debug(f"{log_prefix} Suspect files: {suspect_files}")
        
        # Get recent commits
        recent_commits = self._get_recent_commits(repo_path, suspect_files, limit=20)
        logger.debug(f"{log_prefix} Found {len(recent_commits)} recent commits")
        
        # Get blame info untuk suspect files
        blame_info = self._get_blame_info(repo_path, suspect_files)
        logger.debug(f"{log_prefix} Found {len(blame_info)} blame entries")
        
        # Extract log excerpts (placeholder - akan diimprove)
        log_excerpts = self._extract_log_excerpts(triage_result.summary)
        
        result = ForensicsResult(
            recent_commits=recent_commits,
            blame_info=blame_info,
            log_excerpts=log_excerpts,
            suspect_files=suspect_files,
            timestamp=datetime.utcnow()
        )
        
        logger.info(f"{log_prefix} Forensics analysis completed")
        return result
    
    def _extract_suspect_files(self, error_text: str) -> List[str]:
        """Extract file paths dari error message atau stack trace"""
        files = []
        
        # Pattern untuk file paths dalam stack traces
        patterns = [
            r'at\s+([a-zA-Z0-9_/.-]+\.(js|ts|py|java|go|rb|php)):\d+',
            r'File\s+"([^"]+)"',
            r'in\s+([a-zA-Z0-9_/.-]+\.(js|ts|py|java|go|rb|php))',
            r'([a-zA-Z0-9_/.-]+\.(js|ts|py|java|go|rb|php)):\d+:\d+',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, error_text)
            for match in matches:
                if isinstance(match, tuple):
                    file_path = match[0]
                else:
                    file_path = match
                
                if file_path not in files:
                    files.append(file_path)
        
        # Jika tidak ada file terdeteksi, return empty list
        return files[:5]  # Limit to 5 files
    
    def _get_recent_commits(
        self,
        repo_path: str,
        suspect_files: List[str],
        limit: int = 20
    ) -> List[CommitInfo]:
        """Get recent commits, optionally filtered by suspect files"""
        commits = []
        
        try:
            # Build git log command
            cmd = [
                'git', 'log',
                f'-{limit}',
                '--pretty=format:%H|%an|%ai|%s',
                '--name-only'
            ]
            
            # Add file filter jika ada suspect files
            if suspect_files:
                cmd.append('--')
                cmd.extend(suspect_files)
            
            # Execute git command
            result = subprocess.run(
                cmd,
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.warning(f"Git log failed: {result.stderr}")
                return commits
            
            # Parse output
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
                    # Commit info line
                    parts = line.split('|')
                    if len(parts) == 4:
                        commit_hash, author, date_str, message = parts
                        current_commit = {
                            'hash': commit_hash[:8],  # Short hash
                            'author': author,
                            'date': datetime.fromisoformat(date_str.replace(' ', 'T')),
                            'message': message,
                            'files_changed': []
                        }
                else:
                    # File name
                    if current_commit:
                        files_changed.append(line)
            
            # Add last commit if exists
            if current_commit:
                current_commit['files_changed'] = files_changed
                commits.append(CommitInfo(**current_commit))
        
        except subprocess.TimeoutExpired:
            logger.error("Git log command timeout")
        except Exception as e:
            logger.error(f"Error getting git commits: {e}")
        
        return commits
    
    def _get_blame_info(
        self,
        repo_path: str,
        suspect_files: List[str]
    ) -> List[BlameInfo]:
        """Get git blame info untuk suspect files"""
        blame_entries = []
        
        for file_path in suspect_files:
            try:
                full_path = Path(repo_path) / file_path
                if not full_path.exists():
                    logger.debug(f"File not found: {full_path}")
                    continue
                
                # Get blame for entire file (simplified - bisa diimprove untuk specific lines)
                cmd = [
                    'git', 'blame',
                    '--line-porcelain',
                    file_path
                ]
                
                result = subprocess.run(
                    cmd,
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if result.returncode != 0:
                    logger.warning(f"Git blame failed for {file_path}: {result.stderr}")
                    continue
                
                # Parse blame output (simplified - ambil beberapa lines saja)
                blame_entries.extend(
                    self._parse_blame_output(result.stdout, file_path, limit=5)
                )
            
            except subprocess.TimeoutExpired:
                logger.error(f"Git blame timeout for {file_path}")
            except Exception as e:
                logger.error(f"Error getting blame for {file_path}: {e}")
        
        return blame_entries
    
    def _parse_blame_output(
        self,
        blame_output: str,
        file_path: str,
        limit: int = 5
    ) -> List[BlameInfo]:
        """Parse git blame --line-porcelain output"""
        entries = []
        current_entry = {}
        line_number = 0
        
        for line in blame_output.split('\n'):
            if not line.strip():
                continue
            
            if line.startswith('\t'):
                # This is the actual code line
                line_number += 1
                if current_entry and line_number <= limit:
                    current_entry['line_content'] = line[1:]  # Remove tab
                    current_entry['line_number'] = line_number
                    current_entry['file_path'] = file_path
                    
                    try:
                        entries.append(BlameInfo(**current_entry))
                    except Exception as e:
                        logger.debug(f"Failed to create BlameInfo: {e}")
                    
                    current_entry = {}
            else:
                # Metadata line
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
                    elif len(key) == 40:  # Commit hash
                        current_entry['commit_hash'] = key[:8]
        
        return entries[:limit]
    
    def _extract_log_excerpts(self, error_text: str) -> List[str]:
        """Extract relevant log excerpts dari error text"""
        # Split by lines dan ambil yang meaningful
        lines = [line.strip() for line in error_text.split('\n') if line.strip()]
        
        # Filter out empty lines dan ambil max 10 lines
        excerpts = []
        for line in lines[:10]:
            if len(line) > 20:  # Skip very short lines
                excerpts.append(line)
        
        return excerpts


# Global instance
forensics_agent = ForensicsAgent()


def analyze(
    repo_path: str,
    triage_result: TriageResult,
    correlation_id: Optional[str] = None
) -> ForensicsResult:
    """
    Convenience function untuk forensics analysis.
    
    Usage:
        result = analyze("/path/to/repo", triage_result)
    """
    return forensics_agent.analyze(repo_path, triage_result, correlation_id)
