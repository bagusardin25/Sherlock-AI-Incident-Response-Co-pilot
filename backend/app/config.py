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
    
    # CORS Settings
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Bob CLI Settings
    bob_mock_mode: bool = False
    bob_cli_path: str = "bob"
    bob_timeout: int = 60
    
    # Repository Settings
    fixtures_path: str = "./fixtures"
    sample_repo_path: str = "./fixtures/flaky-shop"
    
    # Logging
    log_level: str = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_prefix="SHERLOCK_"
    )


# Global settings instance
settings = Settings()
