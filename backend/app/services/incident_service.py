"""
Service layer untuk incident CRUD operations
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.db_models import (
    Incident,
    TriageResult,
    ForensicsResult,
    RootCauseAnalysis,
    FixProposal,
    AgentEvent,
)
from app.models.state import IncidentState


class IncidentService:
    """Service untuk mengelola incidents di database"""

    @staticmethod
    async def create_incident(
        db: AsyncSession,
        incident_id: str,
        title: str,
        description: str,
        severity: str,
        alert_data: Optional[dict] = None,
    ) -> Incident:
        """Buat incident baru"""
        incident = Incident(
            id=incident_id,
            title=title,
            description=description,
            severity=severity,
            status="pending",
            alert_data=alert_data,
        )
        db.add(incident)
        await db.flush()
        return incident

    @staticmethod
    async def get_incident(
        db: AsyncSession, incident_id: str, load_relations: bool = True
    ) -> Optional[Incident]:
        """Get incident by ID dengan optional eager loading"""
        query = select(Incident).where(Incident.id == incident_id)
        
        if load_relations:
            query = query.options(
                selectinload(Incident.triage_results),
                selectinload(Incident.forensics_results),
                selectinload(Incident.root_cause_analyses),
                selectinload(Incident.fix_proposals),
                selectinload(Incident.agent_events),
            )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_incidents(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
    ) -> List[Incident]:
        """List incidents dengan pagination dan filter"""
        query = select(Incident).order_by(desc(Incident.created_at))
        
        if status:
            query = query.where(Incident.status == status)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_incident_status(
        db: AsyncSession, incident_id: str, status: str
    ) -> Optional[Incident]:
        """Update status incident"""
        incident = await IncidentService.get_incident(db, incident_id, load_relations=False)
        if incident:
            incident.status = status
            incident.updated_at = datetime.utcnow()
            await db.flush()
        return incident

    @staticmethod
    async def delete_incident(db: AsyncSession, incident_id: str) -> bool:
        """Delete incident (cascade delete semua related data)"""
        incident = await IncidentService.get_incident(db, incident_id, load_relations=False)
        if incident:
            await db.delete(incident)
            await db.flush()
            return True
        return False

    @staticmethod
    async def add_triage_result(
        db: AsyncSession,
        incident_id: str,
        severity: str,
        category: str,
        summary: str,
        recommended_actions: List[str],
    ) -> TriageResult:
        """Tambah triage result ke incident"""
        triage = TriageResult(
            incident_id=incident_id,
            severity=severity,
            category=category,
            summary=summary,
            recommended_actions=recommended_actions,
        )
        db.add(triage)
        await db.flush()
        
        # Update incident status
        await IncidentService.update_incident_status(db, incident_id, "triaged")
        
        return triage

    @staticmethod
    async def add_forensics_result(
        db: AsyncSession,
        incident_id: str,
        suspect_files: List[dict],
        git_history: Optional[List[dict]] = None,
        blame_info: Optional[List[dict]] = None,
    ) -> ForensicsResult:
        """Tambah forensics result ke incident"""
        forensics = ForensicsResult(
            incident_id=incident_id,
            suspect_files=suspect_files,
            git_history=git_history,
            blame_info=blame_info,
        )
        db.add(forensics)
        await db.flush()
        
        # Update incident status
        await IncidentService.update_incident_status(db, incident_id, "investigating")
        
        return forensics

    @staticmethod
    async def add_root_cause_analysis(
        db: AsyncSession,
        incident_id: str,
        root_cause: str,
        contributing_factors: List[str],
        evidence: List[str],
        confidence: str,
    ) -> RootCauseAnalysis:
        """Tambah root cause analysis ke incident"""
        rca = RootCauseAnalysis(
            incident_id=incident_id,
            root_cause=root_cause,
            contributing_factors=contributing_factors,
            evidence=evidence,
            confidence=confidence,
        )
        db.add(rca)
        await db.flush()
        
        # Update incident status
        await IncidentService.update_incident_status(db, incident_id, "analyzed")
        
        return rca

    @staticmethod
    async def add_fix_proposal(
        db: AsyncSession,
        incident_id: str,
        description: str,
        code_changes: List[dict],
        test_plan: List[str],
        rollback_plan: str,
    ) -> FixProposal:
        """Tambah fix proposal ke incident"""
        fix = FixProposal(
            incident_id=incident_id,
            description=description,
            code_changes=code_changes,
            test_plan=test_plan,
            rollback_plan=rollback_plan,
        )
        db.add(fix)
        await db.flush()
        
        # Update incident status
        await IncidentService.update_incident_status(db, incident_id, "fix_proposed")
        
        return fix

    @staticmethod
    async def add_agent_event(
        db: AsyncSession,
        incident_id: str,
        agent: str,
        event_type: str,
        message: str,
        data: Optional[dict] = None,
    ) -> AgentEvent:
        """Tambah agent event ke incident"""
        event = AgentEvent(
            incident_id=incident_id,
            agent=agent,
            event_type=event_type,
            message=message,
            data=data,
        )
        db.add(event)
        await db.flush()
        return event

    @staticmethod
    async def incident_to_state(incident: Incident) -> IncidentState:
        """Convert database Incident model ke IncidentState (Pydantic model)"""
        from app.models.state import (
            TriageResult as TriageResultState,
            ForensicsResult as ForensicsResultState,
            RootCauseAnalysis as RootCauseAnalysisState,
            FixProposal as FixProposalState,
            SuspectFile,
            CommitInfo,
            BlameInfo,
            Severity,
            ErrorType,
            AgentEvent as AgentEventState,
            AgentStatus,
        )

        # Convert triage
        triage_result = None
        if incident.triage_results:
            t = incident.triage_results[-1]
            triage_result = TriageResultState(
                severity=Severity(t.severity) if t.severity in [s.value for s in Severity] else Severity.MEDIUM,
                service=next((a.split(": ", 1)[1] for a in (t.recommended_actions or []) if a.startswith("Service:")), "unknown"),
                error_type=ErrorType(t.category) if t.category in [e.value for e in ErrorType] else ErrorType.UNKNOWN,
                summary=t.summary,
                confidence=float(next((a.split(": ", 1)[1] for a in (t.recommended_actions or []) if a.startswith("Confidence:")), "0.7")),
            )

        # Convert forensics
        forensics_result = None
        if incident.forensics_results:
            f = incident.forensics_results[-1]
            forensics_result = ForensicsResultState(
                recent_commits=[],
                blame_info=[],
                log_excerpts=[],
                suspect_files=[sf.get("path", "") for sf in (f.suspect_files or [])],
            )

        # Convert root cause
        root_cause = None
        if incident.root_cause_analyses:
            rca = incident.root_cause_analyses[-1]
            root_cause = RootCauseAnalysisState(
                root_cause=rca.root_cause,
                suspect_files=[SuspectFile(path=p, reason="identified", confidence=0.7) for p in (rca.evidence or [])],
                reasoning_chain=rca.contributing_factors or [],
                confidence=float(rca.confidence) if rca.confidence.replace(".", "").isdigit() else 0.5,
            )

        # Convert fix
        fix_result = None
        if incident.fix_proposals:
            fx = incident.fix_proposals[-1]
            diff = ""
            if fx.code_changes:
                diff = fx.code_changes[0].get("diff", "") if fx.code_changes else ""
            fix_result = FixProposalState(
                patch_unified_diff=diff,
                test_code=fx.test_plan[0] if fx.test_plan else None,
                pr_title=fx.description,
                pr_body=fx.rollback_plan or "",
                files_modified=[],
            )

        # Convert agent events
        agent_events = [
            AgentEventState(
                agent_name=event.agent,
                status=AgentStatus(event.event_type) if event.event_type in [s.value for s in AgentStatus] else AgentStatus.COMPLETED,
                message=event.message,
                data=event.data,
            )
            for event in incident.agent_events
        ]

        return IncidentState(
            incident_id=incident.id,
            raw_input=incident.alert_data.get("raw_input", incident.description) if incident.alert_data else incident.description,
            repo_path=incident.alert_data.get("repo_path") if incident.alert_data else None,
            triage=triage_result,
            forensics=forensics_result,
            root_cause=root_cause,
            fix=fix_result,
            postmortem=incident.postmortem_text,
            agent_events=agent_events,
            created_at=incident.created_at,
            updated_at=incident.updated_at,
            status=incident.status,
        )
