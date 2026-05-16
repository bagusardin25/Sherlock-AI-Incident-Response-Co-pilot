#!/usr/bin/env python3
"""
Sherlock Backend - Startup Script

Quick start script untuk menjalankan Sherlock API server.
"""
import sys
import os
from pathlib import Path

# Add app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    import uvicorn
    from app.config import settings
    
    print("=" * 60)
    print("🔍 Sherlock AI Incident Response Co-pilot")
    print("=" * 60)
    print(f"Version: {settings.api_version}")
    print(f"Bob Mock Mode: {settings.bob_mock_mode}")
    print(f"Log Level: {settings.log_level}")
    print(f"Port: {settings.port}")
    print("=" * 60)
    print("\nStarting server...")
    print(f"API Docs: http://localhost:{settings.port}/docs")
    print(f"Health Check: http://localhost:{settings.port}/health")
    print("\nPress CTRL+C to stop\n")

    reload_enabled = os.getenv("SHERLOCK_RELOAD", "false").lower() == "true"
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=reload_enabled,
        log_level=settings.log_level.lower()
    )
