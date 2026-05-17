"""
Configuration management untuk Sherlock backend.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    api_title: str = "Sherlock API"
    api_version: str = "1.0.0"
    api_description: str = "AI Incident Response Co-pilot Backend"
    
    # Server port (Railway assigns $PORT dynamically)
    port: int = 8000
    
    # CORS Settings
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "https://sherlockai-ibm.vercel.app"]
    
    # IBM Bob API Settings (Analyst + Fix agents)
    bob_mock_mode: bool = False
    bob_api_key: str = ""
    bob_api_url: str = "https://api.ibm-bob.ai/v1/chat/completions"
    bob_model: str = "bob-v1"
    bob_timeout: float = 120.0
    bob_cli_path: str = "bob"

    # OpenRouter Settings (supporting agents: triage, forensics, postmortem)
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_timeout: float = 60.0

    # Database Settings
    database_url: str = "postgresql+asyncpg://sherlock:sherlock_dev_password@localhost:5432/sherlock_db"
    database_echo: bool = False
    database_pool_size: int = 5
    database_max_overflow: int = 10
    
    # Repository Settings
    fixtures_path: str = "./fixtures"
    sample_repo_path: str = "./fixtures/flaky-shop"
    
    # Logging
    log_level: str = "INFO"
    
    # Authentication Settings
    secret_key: str = "your-secret-key-change-in-production-min-32-chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # GitHub Integration (for pushing postmortem/fix files to repos)
    github_token: str = ""
    
    # Google OAuth Settings
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"
    frontend_url: str = "http://localhost:3000"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_prefix="SHERLOCK_",
        # Also read PORT without prefix (Railway sets PORT=xxxx directly)
        extra="ignore",
    )

# Global settings instance
settings = Settings()

# Railway sets PORT directly (not SHERLOCK_PORT), so override if present
_railway_port = os.environ.get("PORT")
if _railway_port:
    settings.port = int(_railway_port)
