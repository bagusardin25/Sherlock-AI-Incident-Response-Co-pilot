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
from app.database import AsyncSessionLocal
from app.services.repo_manager import repo_manager

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
            agent_failed = False

            # Agent 1: Triage
            try:
                async for event in self._run_triage(state):
                    yield event
            except Exception as e:
                agent_failed = True
                logger.warning(f"[{incident_id}] Triage failed but pipeline continues: {e}")
            
            # Agent 2: Forensics (requires triage, but can proceed with defaults)
            try:
                async for event in self._run_forensics(state):
                    yield event
            except Exception as e:
                agent_failed = True
                logger.warning(f"[{incident_id}] Forensics failed but pipeline continues: {e}")
            
            # Agent 3: Bob Analyst (Root Cause)
            try:
                async for event in self._run_bob_analyst(state):
                    yield event
            except Exception as e:
                agent_failed = True
                logger.warning(f"[{incident_id}] Bob analyst failed but pipeline continues: {e}")
            
            # Agent 4: Fix Generation
            try:
                async for event in self._run_fix_generation(state):
                    yield event
            except Exception as e:
                agent_failed = True
                logger.warning(f"[{incident_id}] Fix generation failed but pipeline continues: {e}")
            
            # Agent 5: Postmortem
            try:
                async for event in self._run_postmortem(state):
                    yield event
            except Exception as e:
                agent_failed = True
                logger.warning(f"[{incident_id}] Postmortem failed but pipeline continues: {e}")
            
            # Pipeline completed (possibly with partial failures)
            state.status = "completed" if not agent_failed else "partial"
            state.updated_at = datetime.utcnow()
            
            completion_status = AgentStatus.COMPLETED
            completion_msg = "Incident analysis pipeline completed successfully"
            if agent_failed:
                completion_msg = "Incident analysis pipeline completed with partial results (some agents failed)"
            
            completion_event = AgentEvent(
                agent_name="pipeline",
                status=completion_status,
                message=completion_msg,
                data={"incident_id": incident_id}
            )
            state.agent_events.append(completion_event)
            yield completion_event
            
            logger.info(f"[{incident_id}] Pipeline completed {'with partial results' if agent_failed else 'successfully'}")
            
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
            # ALWAYS save results to DB — even if client disconnected mid-stream.
            # This was previously in the try block before yield, but generators
            # can be cancelled by GeneratorExit when the SSE client closes the
            # connection, causing _save_results_to_db to never execute.
            try:
                await self._save_results_to_db(state)
            except Exception as save_err:
                logger.error(f"[{incident_id}] Save in finally failed: {save_err}")

            # Cleanup temp repo
            repo_manager.cleanup(incident_id)
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
            # Run triage (async - OpenRouter)
            result = await triage.triage(
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
            raise  # Propagate to pipeline-level handler
    
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
            # Forensics requires triage result
            if state.triage is None:
                skip_event = AgentEvent(
                    agent_name=agent_name,
                    status=AgentStatus.FAILED,
                    message="Forensics skipped: triage result not available"
                )
                state.agent_events.append(skip_event)
                yield skip_event
                return

            # Run forensics (async with AI reasoning)
            result = await forensics.analyze(
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
            raise  # Propagate to pipeline-level handler
    
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
            # Bob analyst requires triage + forensics
            if state.triage is None or state.forensics is None:
                missing = []
                if state.triage is None: missing.append('triage')
                if state.forensics is None: missing.append('forensics')
                skip_event = AgentEvent(
                    agent_name=agent_name,
                    status=AgentStatus.FAILED,
                    message=f"Bob analysis skipped: {', '.join(missing)} result(s) not available"
                )
                state.agent_events.append(skip_event)
                yield skip_event
                return

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
            raise  # Propagate to pipeline-level handler
    
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
            # Fix generation requires triage + forensics + root_cause
            if state.triage is None or state.forensics is None or state.root_cause is None:
                missing = []
                if state.triage is None: missing.append('triage')
                if state.forensics is None: missing.append('forensics')
                if state.root_cause is None: missing.append('root cause')
                skip_event = AgentEvent(
                    agent_name=agent_name,
                    status=AgentStatus.FAILED,
                    message=f"Fix generation skipped: {', '.join(missing)} result(s) not available"
                )
                state.agent_events.append(skip_event)
                yield skip_event
                return

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
            raise  # Propagate to pipeline-level handler
    
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
            # Run postmortem generation (async - OpenRouter)
            result = await postmortem.generate(
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
            raise  # Propagate to pipeline-level handler
    
    async def _save_results_to_db(self, state: IncidentState):
        """Save pipeline results to database"""
        from app.models.db_models import (
            Incident, TriageResult as DBTriage, ForensicsResult as DBForensics,
            RootCauseAnalysis as DBRCA, FixProposal as DBFix,
        )
        logger.info(f"[{state.incident_id}] _save_results_to_db: starting")
        logger.info(f"[{state.incident_id}]   triage={state.triage is not None}, forensics={state.forensics is not None}, root_cause={state.root_cause is not None}, fix={state.fix is not None}, postmortem={state.postmortem is not None}")
        try:
            async with AsyncSessionLocal() as db:
                incident = await db.get(Incident, state.incident_id)
                if not incident:
                    logger.error(f"[{state.incident_id}] Incident not found in DB — cannot save results")
                    return

                incident.status = "completed"
                incident.updated_at = datetime.utcnow()
                logger.info(f"[{state.incident_id}]   status → completed")

                if state.triage:
                    t = state.triage
                    db.add(DBTriage(
                        incident_id=state.incident_id,
                        severity=t.severity.value,
                        category=t.error_type.value,
                        summary=t.summary,
                        recommended_actions=[f"Service: {t.service}", f"Confidence: {t.confidence}"],
                    ))
                    logger.info(f"[{state.incident_id}]   + triage saved")

                if state.forensics:
                    f = state.forensics
                    db.add(DBForensics(
                        incident_id=state.incident_id,
                        suspect_files=[{"path": p} for p in f.suspect_files],
                        git_history=[c.model_dump(mode="json") for c in f.recent_commits[:10]],
                        blame_info=[b.model_dump(mode="json") for b in f.blame_info[:10]],
                    ))
                    logger.info(f"[{state.incident_id}]   + forensics saved")

                if state.root_cause:
                    rc = state.root_cause
                    db.add(DBRCA(
                        incident_id=state.incident_id,
                        root_cause=rc.root_cause,
                        contributing_factors=rc.reasoning_chain,
                        evidence=[sf.path for sf in rc.suspect_files],
                        confidence=str(rc.confidence),
                    ))
                    logger.info(f"[{state.incident_id}]   + root_cause saved")

                if state.fix:
                    fx = state.fix
                    db.add(DBFix(
                        incident_id=state.incident_id,
                        description=fx.pr_title,
                        code_changes=[{"diff": fx.patch_unified_diff}],
                        test_plan=[fx.test_code or "No test generated"],
                        rollback_plan=fx.pr_body[:500],
                    ))
                    logger.info(f"[{state.incident_id}]   + fix saved")

                if state.postmortem:
                    incident.postmortem_text = state.postmortem
                    logger.info(f"[{state.incident_id}]   + postmortem saved ({len(state.postmortem)} chars)")

                await db.commit()
                logger.info(f"[{state.incident_id}] ✓ All results committed to database")

        except Exception as e:
            logger.error(f"[{state.incident_id}] ✗ Failed to save results to DB: {e}", exc_info=True)

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
