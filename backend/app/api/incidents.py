"""
Incident API Routes - Handle incident submission dan streaming
"""
import logging
import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.incident_service import IncidentService
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
async def submit_incident(
    submission: IncidentSubmission,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit new incident untuk analysis.
    
    Returns incident_id dan URL untuk streaming progress.
    """
    # Generate incident ID jika tidak provided
    incident_id = submission.incident_id or f"inc-{uuid.uuid4().hex[:8]}"
    
    logger.info(f"[{incident_id}] New incident submitted")
    
    # Create incident in database
    try:
        await IncidentService.create_incident(
            db=db,
            incident_id=incident_id,
            title=f"Incident {incident_id}",
            description=submission.raw_input[:500],  # Truncate for title
            severity="unknown",
            alert_data={
                "raw_input": submission.raw_input,
                "repo_path": submission.repo_path
            }
        )
        await db.commit()
        
        # Log agent event
        await IncidentService.add_agent_event(
            db=db,
            incident_id=incident_id,
            agent="api",
            event_type="incident_created",
            message="Incident submitted via API",
            data={"repo_path": submission.repo_path}
        )
        await db.commit()
        
    except Exception as e:
        logger.error(f"[{incident_id}] Failed to create incident: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create incident: {str(e)}")
    
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
    repo_path: str = Query(..., description="Repository path"),
    db: AsyncSession = Depends(get_db)
):
    """
    Stream incident analysis progress via Server-Sent Events (SSE).
    
    Client should connect to this endpoint after submitting incident.
    """
    logger.info(f"[{incident_id}] Starting SSE stream")
    
    # Verify incident exists
    incident = await IncidentService.get_incident(db, incident_id, load_relations=False)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    
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
async def get_incident_state(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get current state untuk incident.
    
    Returns full incident state dari database atau 404 jika tidak ditemukan.
    """
    incident = await IncidentService.get_incident(db, incident_id, load_relations=True)
    
    if not incident:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found"
        )
    
    # Convert to IncidentState
    state = await IncidentService.incident_to_state(incident)
    return state


@router.get("/", response_model=List[IncidentState])
async def list_incidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    List all incidents dengan pagination dan optional status filter.
    """
    incidents = await IncidentService.list_incidents(
        db=db,
        skip=skip,
        limit=limit,
        status=status
    )
    
    # Convert to IncidentState list
    states = []
    for incident in incidents:
        # Load relations for each incident
        full_incident = await IncidentService.get_incident(db, incident.id, load_relations=True)
        if full_incident:
            state = await IncidentService.incident_to_state(full_incident)
            states.append(state)
    
    return states


@router.delete("/{incident_id}")
async def delete_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete incident dan semua related data.
    """
    success = await IncidentService.delete_incident(db, incident_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found"
        )
    
    await db.commit()
    
    return {
        "incident_id": incident_id,
        "status": "deleted",
        "message": "Incident and all related data deleted successfully"
    }


@router.get("/{incident_id}/postmortem")
async def get_postmortem(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get postmortem document untuk completed incident.
    
    Returns markdown text atau 404 jika belum selesai.
    """
    incident = await IncidentService.get_incident(db, incident_id, load_relations=True)
    
    if not incident:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found"
        )
    
    state = await IncidentService.incident_to_state(incident)
    
    if not state.postmortem:
        raise HTTPException(
            status_code=404,
            detail=f"Postmortem not yet generated for incident {incident_id}"
        )
    
    return {
        "incident_id": incident_id,
        "postmortem": state.postmortem
    }