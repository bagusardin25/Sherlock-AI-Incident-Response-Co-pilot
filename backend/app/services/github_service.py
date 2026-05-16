"""
GitHub Service - Push files to repositories via GitHub Contents API
"""
import base64
import logging
import re
from typing import Optional
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

GITHUB_REPO_PATTERN = re.compile(
    r"https?://github\.com/(?P<owner>[\w.\-]+)/(?P<repo>[\w.\-]+?)(?:\.git)?/?$"
)


@dataclass
class GitHubCommitResult:
    """Result of a successful file push to GitHub."""
    commit_sha: str
    commit_url: str
    file_url: str


class GitHubServiceError(Exception):
    pass


class GitHubService:
    """Service to interact with GitHub REST API."""

    BASE_URL = "https://api.github.com"

    @staticmethod
    def parse_repo_url(repo_url: str) -> tuple[str, str]:
        """Extract owner and repo name from a GitHub URL.

        Returns (owner, repo) tuple.
        """
        match = GITHUB_REPO_PATTERN.match(repo_url.strip())
        if not match:
            raise GitHubServiceError(f"Cannot parse GitHub URL: {repo_url}")
        return match.group("owner"), match.group("repo")

    @staticmethod
    async def create_file(
        repo_url: str,
        file_path: str,
        content: str,
        commit_message: str,
        token: str,
        branch: Optional[str] = None,
    ) -> GitHubCommitResult:
        """Create or update a file in a GitHub repository.

        Uses the GitHub Contents API:
        PUT /repos/{owner}/{repo}/contents/{path}

        Args:
            repo_url: Full GitHub repository URL
            file_path: Path within the repo (e.g. "sherlock-reports/postmortem.md")
            content: File content as a string
            commit_message: Git commit message
            token: GitHub Personal Access Token
            branch: Target branch (defaults to repo's default branch)

        Returns:
            GitHubCommitResult with commit details
        """
        owner, repo = GitHubService.parse_repo_url(repo_url)

        # Base64-encode the content (required by GitHub API)
        content_b64 = base64.b64encode(content.encode("utf-8")).decode("utf-8")

        url = f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/contents/{file_path}"

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        body: dict = {
            "message": commit_message,
            "content": content_b64,
        }

        if branch:
            body["branch"] = branch

        # Check if file already exists (we need its SHA to update)
        async with httpx.AsyncClient(timeout=30.0) as client:
            existing = await client.get(url, headers=headers)
            if existing.status_code == 200:
                existing_data = existing.json()
                body["sha"] = existing_data["sha"]
                logger.info(f"File {file_path} already exists — will update (SHA: {existing_data['sha'][:7]})")

            logger.info(f"Pushing {file_path} to {owner}/{repo}")
            response = await client.put(url, headers=headers, json=body)

        if response.status_code not in (200, 201):
            error_detail = response.json().get("message", response.text)
            logger.error(f"GitHub API error ({response.status_code}): {error_detail}")

            if response.status_code == 401:
                raise GitHubServiceError("GitHub authentication failed. Check your SHERLOCK_GITHUB_TOKEN.")
            elif response.status_code == 403:
                raise GitHubServiceError("Permission denied. Make sure your GitHub token has 'repo' scope.")
            elif response.status_code == 404:
                raise GitHubServiceError(f"Repository {owner}/{repo} not found or token lacks access.")
            else:
                raise GitHubServiceError(f"GitHub API error: {error_detail}")

        data = response.json()
        commit_sha = data["commit"]["sha"]
        commit_url = data["commit"]["html_url"]
        file_url = data["content"]["html_url"]

        logger.info(f"Successfully pushed {file_path} — commit {commit_sha[:7]}")

        return GitHubCommitResult(
            commit_sha=commit_sha,
            commit_url=commit_url,
            file_url=file_url,
        )


# Global instance
github_service = GitHubService()
