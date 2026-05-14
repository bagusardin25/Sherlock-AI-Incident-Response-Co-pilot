"""
Pipeline Orchestrator - Menjalankan multi-agent pipeline untuk incident analysis
"""
import asyncio
import logging
import uuid
from datetime import datetime
from typing import Optional, AsyncIterator

from app.models.state import (
    IncidentState, AgentEvent, AgentStatus
)
from app.agents import triage, forensics, bob_analyst, fix, postmortem

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """Orchestrator untuk menjalankan agent pipeline"""
    
    def __init__(self):
        """Initialize Pipeline Orchestrator"""
        self.active_pipelines = {}
    
    async def run_pipeline(
        self,
        incident_id: str,
        raw_input: str,
        repo_path: str
    ) -> AsyncIterator[AgentEvent]:
        """
        Run complete incident analysis pipeline dengan streaming events.
        
        Args:
            incident_id: Unique ID untuk incident
            raw_input: Raw alert/error text
            repo_path: Path ke repository untuk analysis
            
        Yields:
            AgentEvent untuk setiap step dalam pipeline
        """
        logger.info(f"[{incident_id}] Starting pipeline for incident")
        
        # Initialize state
        state = IncidentState(
            incident_id=incident_id,
            raw_input=raw_input,
            repo_path=repo_path,
            status="processing"
        )
        
        # Store in active pipelines
        self.active_pipelines[incident_id] = state
        
        try:
            # Agent 1: Triage
            async for event in self._run_triage(state):
                yield event
            
            # Agent 2: Forensics
            async for event in self._run_forensics(state):
                yield event
            
            # Agent 3: Bob Analyst (Root Cause)
            async for event in self._run_bob_analyst(state):
                yield event
            
            # Agent 4: Fix Generation
            async for event in self._run_fix_generation(state):
                yield event
            
            # Agent 5: Postmortem
            async for event in self._run_postmortem(state):
                yield event
            
            # Pipeline completed
            state.status = "completed"
            state.updated_at = datetime.utcnow()
            
            completion_event = AgentEvent(
                agent_name="pipeline",
                status=AgentStatus.COMPLETED,
                message="Incident analysis pipeline completed successfully",
                data={"incident_id": incident_id}
            )
            state.agent_events.append(completion_event)
            yield completion_event
            
            logger.info(f"[{incident_id}] Pipeline completed successfully")
            
        except Exception as e:
            logger.error(f"[{incident_id}] Pipeline failed: {e}", exc_info=True)
            
            state.status = "failed"
            state.updated_at = datetime.utcnow()
            
            error_event = AgentEvent(
                agent_name="pipeline",
                status=AgentStatus.FAILED,
                message=f"Pipeline failed: {str(e)}",
                data={"error": str(e)}
            )
            state.agent_events.append(error_event)
            yield error_event
        
        finally:
            # Cleanup
            if incident_id in self.active_pipelines:
                del self.active_pipelines[incident_id]
    
    async def _run_triage(self, state: IncidentState) -> AsyncIterator[AgentEvent]:
        """Run triage agent"""
        agent_name = "triage"
        
        # Start event
        start_event = AgentEvent(
            agent_name=agent_name,
            status=AgentStatus.RUNNING,
            message="Analyzing incident severity and type..."
        )
        state.agent_events.append(start_event)
        yield start_event
        
        try:
            # Run triage (synchronous)
            result = await asyncio.to_thread(
                triage.triage,
                state.raw_input,
                state.incident_id
            )
            
            state.triage = result
            
            # Completion event
            complete_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.COMPLETED,
                message=f"Triage completed: {result.severity.value.upper()} severity, {result.error_type.value}",
                data={
                    "severity": result.severity.value,
                    "error_type": result.error_type.value,
                    "service": result.service,
                    "confidence": result.confidence
                }
            )
            state.agent_events.append(complete_event)
            yield complete_event
            
        except Exception as e:
            logger.error(f"[{state.incident_id}] Triage failed: {e}")
            error_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.FAILED,
                message=f"Triage failed: {str(e)}"
            )
            state.agent_events.append(error_event)
            yield error_event
            raise
    
    async def _run_forensics(self, state: IncidentState) -> AsyncIterator[AgentEvent]:
        """Run forensics agent"""
        agent_name = "forensics"
        
        start_event = AgentEvent(
            agent_name=agent_name,
            status=AgentStatus.RUNNING,
            message="Gathering git history and code context..."
        )
        state.agent_events.append(start_event)
        yield start_event
        
        try:
            # Run forensics (synchronous)
            result = await asyncio.to_thread(
                forensics.analyze,
                state.repo_path,
                state.triage,
                state.incident_id
            )
            
            state.forensics = result
            
            complete_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.COMPLETED,
                message=f"Forensics completed: {len(result.recent_commits)} commits, {len(result.suspect_files)} suspect files",
                data={
                    "commits_count": len(result.recent_commits),
                    "suspect_files": result.suspect_files,
                    "blame_entries": len(result.blame_info)
                }
            )
            state.agent_events.append(complete_event)
            yield complete_event
            
        except Exception as e:
            logger.error(f"[{state.incident_id}] Forensics failed: {e}")
            error_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.FAILED,
                message=f"Forensics failed: {str(e)}"
            )
            state.agent_events.append(error_event)
            yield error_event
            raise
    
    async def _run_bob_analyst(self, state: IncidentState) -> AsyncIterator[AgentEvent]:
        """Run Bob analyst agent"""
        agent_name = "bob_analyst"
        
        start_event = AgentEvent(
            agent_name=agent_name,
            status=AgentStatus.RUNNING,
            message="🧠 Bob analyzing codebase for root cause..."
        )
        state.agent_events.append(start_event)
        yield start_event
        
        try:
            # Run Bob analysis (async)
            result = await bob_analyst.analyze(
                state.repo_path,
                state.triage,
                state.forensics,
                state.incident_id
            )
            
            state.root_cause = result
            
            complete_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.COMPLETED,
                message=f"Root cause identified: {result.root_cause[:100]}...",
                data={
                    "root_cause": result.root_cause,
                    "suspect_files_count": len(result.suspect_files),
                    "confidence": result.confidence
                }
            )
            state.agent_events.append(complete_event)
            yield complete_event
            
        except Exception as e:
            logger.error(f"[{state.incident_id}] Bob analyst failed: {e}")
            error_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.FAILED,
                message=f"Bob analysis failed: {str(e)}"
            )
            state.agent_events.append(error_event)
            yield error_event
            raise
    
    async def _run_fix_generation(self, state: IncidentState) -> AsyncIterator[AgentEvent]:
        """Run fix generation agent"""
        agent_name = "fix"
        
        start_event = AgentEvent(
            agent_name=agent_name,
            status=AgentStatus.RUNNING,
            message="🛠️ Generating code fix with Bob..."
        )
        state.agent_events.append(start_event)
        yield start_event
        
        try:
            # Run fix generation (async)
            result = await fix.generate_fix(
                state.repo_path,
                state.triage,
                state.forensics,
                state.root_cause,
                state.incident_id
            )
            
            state.fix = result
            
            complete_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.COMPLETED,
                message=f"Fix generated: {result.pr_title}",
                data={
                    "pr_title": result.pr_title,
                    "files_modified": result.files_modified,
                    "has_test": result.test_code is not None
                }
            )
            state.agent_events.append(complete_event)
            yield complete_event
            
        except Exception as e:
            logger.error(f"[{state.incident_id}] Fix generation failed: {e}")
            error_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.FAILED,
                message=f"Fix generation failed: {str(e)}"
            )
            state.agent_events.append(error_event)
            yield error_event
            raise
    
    async def _run_postmortem(self, state: IncidentState) -> AsyncIterator[AgentEvent]:
        """Run postmortem generation agent"""
        agent_name = "postmortem"
        
        start_event = AgentEvent(
            agent_name=agent_name,
            status=AgentStatus.RUNNING,
            message="📝 Generating postmortem document..."
        )
        state.agent_events.append(start_event)
        yield start_event
        
        try:
            # Run postmortem generation (synchronous)
            result = await asyncio.to_thread(
                postmortem.generate,
                state,
                state.incident_id
            )
            
            state.postmortem = result
            
            complete_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.COMPLETED,
                message="Postmortem document generated",
                data={
                    "length": len(result),
                    "sections": result.count('##')
                }
            )
            state.agent_events.append(complete_event)
            yield complete_event
            
        except Exception as e:
            logger.error(f"[{state.incident_id}] Postmortem generation failed: {e}")
            error_event = AgentEvent(
                agent_name=agent_name,
                status=AgentStatus.FAILED,
                message=f"Postmortem generation failed: {str(e)}"
            )
            state.agent_events.append(error_event)
            yield error_event
            raise
    
    def get_incident_state(self, incident_id: str) -> Optional[IncidentState]:
        """Get current state untuk incident"""
        return self.active_pipelines.get(incident_id)


# Global orchestrator instance
orchestrator = PipelineOrchestrator()


async def run_incident_analysis(
    raw_input: str,
    repo_path: str,
    incident_id: Optional[str] = None
) -> AsyncIterator[AgentEvent]:
    """
    Convenience function untuk run pipeline.
    
    Usage:
        async for event in run_incident_analysis(alert_text, "/path/to/repo"):
            print(f"{event.agent_name}: {event.message}")
    """
    if not incident_id:
        incident_id = f"inc-{uuid.uuid4().hex[:8]}"
    
    async for event in orchestrator.run_pipeline(incident_id, raw_input, repo_path):
        yield event
