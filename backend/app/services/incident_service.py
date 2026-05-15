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
            AgentEvent as AgentEventState,
        )
        
        # Convert triage results
        triage_result = None
        if incident.triage_results:
            latest_triage = incident.triage_results[-1]
            triage_result = TriageResultState(
                severity=latest_triage.severity,
                category=latest_triage.category,
                summary=latest_triage.summary,
                recommended_actions=latest_triage.recommended_actions,
                timestamp=latest_triage.timestamp,
            )
        
        # Convert forensics results
        forensics_result = None
        if incident.forensics_results:
            latest_forensics = incident.forensics_results[-1]
            forensics_result = ForensicsResultState(
                suspect_files=latest_forensics.suspect_files,
                git_history=latest_forensics.git_history,
                blame_info=latest_forensics.blame_info,
                timestamp=latest_forensics.timestamp,
            )
        
        # Convert root cause analysis
        root_cause_analysis = None
        if incident.root_cause_analyses:
            latest_rca = incident.root_cause_analyses[-1]
            root_cause_analysis = RootCauseAnalysisState(
                root_cause=latest_rca.root_cause,
                contributing_factors=latest_rca.contributing_factors,
                evidence=latest_rca.evidence,
                confidence=latest_rca.confidence,
                timestamp=latest_rca.timestamp,
            )
        
        # Convert fix proposal
        fix_proposal = None
        if incident.fix_proposals:
            latest_fix = incident.fix_proposals[-1]
            fix_proposal = FixProposalState(
                description=latest_fix.description,
                code_changes=latest_fix.code_changes,
                test_plan=latest_fix.test_plan,
                rollback_plan=latest_fix.rollback_plan,
                timestamp=latest_fix.timestamp,
            )
        
        # Convert agent events
        agent_events = [
            AgentEventState(
                agent=event.agent,
                event_type=event.event_type,
                message=event.message,
                data=event.data,
                timestamp=event.timestamp,
            )
            for event in incident.agent_events
        ]
        
        return IncidentState(
            incident_id=incident.id,
            title=incident.title,
            description=incident.description,
            severity=incident.severity,
            status=incident.status,
            triage_result=triage_result,
            forensics_result=forensics_result,
            root_cause_analysis=root_cause_analysis,
            fix_proposal=fix_proposal,
            agent_events=agent_events,
            created_at=incident.created_at,
            updated_at=incident.updated_at,
        )
