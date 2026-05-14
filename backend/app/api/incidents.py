"""
Incident API Routes - Handle incident submission dan streaming
"""
import logging
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.orchestrator.pipeline import orchestrator, run_incident_analysis
from app.models.state import IncidentState

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


class IncidentSubmission(BaseModel):
    """Request model untuk submit incident"""
    raw_input: str = Field(..., description="Raw alert/error text")
    repo_path: str = Field(..., description="Path to repository for analysis")
    incident_id: Optional[str] = Field(None, description="Optional custom incident ID")


class IncidentResponse(BaseModel):
    """Response model untuk incident submission"""
    incident_id: str
    status: str
    message: str
    stream_url: str


@router.post("/", response_model=IncidentResponse)
async def submit_incident(submission: IncidentSubmission):
    """
    Submit new incident untuk analysis.
    
    Returns incident_id dan URL untuk streaming progress.
    """
    # Generate incident ID jika tidak provided
    incident_id = submission.incident_id or f"inc-{uuid.uuid4().hex[:8]}"
    
    logger.info(f"[{incident_id}] New incident submitted")
    
    # Validate repo path exists (basic check)
    # TODO: Add more robust validation
    
    # Return response dengan stream URL
    return IncidentResponse(
        incident_id=incident_id,
        status="processing",
        message="Incident analysis started",
        stream_url=f"/api/incidents/{incident_id}/stream"
    )


@router.get("/{incident_id}/stream")
async def stream_incident_analysis(
    incident_id: str,
    raw_input: str = Query(..., description="Raw alert text"),
    repo_path: str = Query(..., description="Repository path")
):
    """
    Stream incident analysis progress via Server-Sent Events (SSE).
    
    Client should connect to this endpoint after submitting incident.
    """
    logger.info(f"[{incident_id}] Starting SSE stream")
    
    async def event_generator():
        """Generate SSE events dari pipeline"""
        try:
            async for event in run_incident_analysis(raw_input, repo_path, incident_id):
                # Format as SSE
                event_data = event.model_dump_json()
                yield f"data: {event_data}\n\n"
            
            # Send completion marker
            yield "data: {\"type\": \"complete\"}\n\n"
            
        except Exception as e:
            logger.error(f"[{incident_id}] Stream error: {e}", exc_info=True)
            error_data = {
                "type": "error",
                "message": str(e)
            }
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/{incident_id}/state")
async def get_incident_state(incident_id: str):
    """
    Get current state untuk incident yang sedang berjalan.
    
    Returns full incident state atau 404 jika tidak ditemukan.
    """
    state = orchestrator.get_incident_state(incident_id)
    
    if not state:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found or already completed"
        )
    
    return state


@router.get("/{incident_id}/postmortem")
async def get_postmortem(incident_id: str):
    """
    Get postmortem document untuk completed incident.
    
    Returns markdown text atau 404 jika belum selesai.
    """
    state = orchestrator.get_incident_state(incident_id)
    
    if not state:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found"
        )
    
    if not state.postmortem:
        raise HTTPException(
            status_code=404,
            detail=f"Postmortem not yet generated for incident {incident_id}"
        )
    
    return {
        "incident_id": incident_id,
        "postmortem": state.postmortem
    }
