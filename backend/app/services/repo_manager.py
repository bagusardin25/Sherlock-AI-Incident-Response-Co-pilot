"""
Repo Manager - Clone and manage GitHub repositories for analysis
"""
import logging
import re
import shutil
import tempfile
from pathlib import Path
from typing import Optional

import git

logger = logging.getLogger(__name__)

GITHUB_URL_PATTERN = re.compile(
    r"^https?://github\.com/[\w.\-]+/[\w.\-]+(\.git)?/?$"
)


class RepoManagerError(Exception):
    pass


class RepoManager:
    """Manages cloning and cleanup of git repositories."""

    def __init__(self):
        self._temp_dirs: dict[str, Path] = {}  # incident_id -> path

    def validate_url(self, url: str) -> bool:
        """Check if URL is a valid GitHub repo URL."""
        return bool(GITHUB_URL_PATTERN.match(url.strip()))

    def clone(self, repo_url: str, incident_id: str, branch: Optional[str] = None) -> str:
        """
        Clone a GitHub repo to a temp directory.

        Returns the local path to the cloned repo.
        """
        url = repo_url.strip().rstrip("/")
        if not url.endswith(".git"):
            url += ".git"

        if not self.validate_url(repo_url):
            raise RepoManagerError(f"Invalid GitHub URL: {repo_url}")

        temp_dir = Path(tempfile.mkdtemp(prefix=f"sherlock_{incident_id}_"))
        logger.info(f"[{incident_id}] Cloning {repo_url} to {temp_dir}")

        try:
            clone_args = {"depth": 1}
            if branch:
                clone_args["branch"] = branch

            git.Repo.clone_from(url, str(temp_dir), **clone_args)
        except git.GitCommandError as e:
            shutil.rmtree(temp_dir, ignore_errors=True)
            error_msg = (e.stderr or str(e)).strip()
            if "not found" in error_msg.lower() or "404" in error_msg:
                raise RepoManagerError(
                    f"Repository not found: {repo_url}. Make sure the URL is correct and the repository is public."
                )
            elif "authentication" in error_msg.lower() or "403" in error_msg:
                raise RepoManagerError(
                    f"Access denied: {repo_url}. Sherlock currently only supports public repositories."
                )
            else:
                raise RepoManagerError(f"Failed to clone repository: {error_msg}")

        self._temp_dirs[incident_id] = temp_dir
        logger.info(f"[{incident_id}] Clone complete: {temp_dir}")
        return str(temp_dir)

    def cleanup(self, incident_id: str):
        """Remove cloned repo temp directory."""
        path = self._temp_dirs.pop(incident_id, None)
        if path and path.exists():
            shutil.rmtree(path, ignore_errors=True)
            logger.info(f"[{incident_id}] Cleaned up {path}")

    def get_path(self, incident_id: str) -> Optional[str]:
        """Get the local path for an incident's repo."""
        path = self._temp_dirs.get(incident_id)
        return str(path) if path else None


# Global instance
repo_manager = RepoManager()
