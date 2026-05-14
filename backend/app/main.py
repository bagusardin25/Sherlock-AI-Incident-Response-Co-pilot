"""
Sherlock API - Main FastAPI application
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api import incidents

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager untuk startup dan shutdown"""
    logger.info("Starting Sherlock API...")
    yield
    logger.info("Shutting down Sherlock API...")


# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(incidents.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Sherlock API",
        "version": settings.api_version,
        "description": "AI Incident Response Co-pilot Backend",
        "endpoints": {
            "health": "/health",
            "incidents": "/api/incidents",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "sherlock-api",
            "version": settings.api_version,
            "bob_mock_mode": settings.bob_mock_mode
        }
    )


@app.get("/api/health")
async def api_health_check():
    """API health check endpoint (alternative path)"""
    return await health_check()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower()
    )