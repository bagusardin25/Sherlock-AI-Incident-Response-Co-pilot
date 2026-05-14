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
    import uvicorn
    from app.config import settings
    
    print("=" * 60)
    print("🔍 Sherlock AI Incident Response Co-pilot")
    print("=" * 60)
    print(f"Version: {settings.api_version}")
    print(f"Bob Mock Mode: {settings.bob_mock_mode}")
    print(f"Log Level: {settings.log_level}")
    print("=" * 60)
    print("\nStarting server...")
    print(f"API Docs: http://localhost:8000/docs")
    print(f"Health Check: http://localhost:8000/health")
    print("\nPress CTRL+C to stop\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower()
    )
