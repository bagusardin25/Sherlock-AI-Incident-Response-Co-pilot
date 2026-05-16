import asyncio
from app.database import AsyncSessionLocal
from app.models.db_models import Incident, TriageResult, ForensicsResult, RootCauseAnalysis, FixProposal
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Incident)
            .options(
                selectinload(Incident.triage_results),
                selectinload(Incident.forensics_results),
                selectinload(Incident.root_cause_analyses),
                selectinload(Incident.fix_proposals),
            )
            .order_by(Incident.created_at.desc())
            .limit(5)
        )
        incidents = result.scalars().all()
        if not incidents:
            print("NO INCIDENTS FOUND IN DB")
            return
        for inc in incidents:
            pm_len = len(inc.postmortem_text) if inc.postmortem_text else 0
            print(f"ID: {inc.id}")
            print(f"  Status: {inc.status}")
            print(f"  Triage results: {len(inc.triage_results)}")
            print(f"  Forensics results: {len(inc.forensics_results)}")
            print(f"  RCA results: {len(inc.root_cause_analyses)}")
            print(f"  Fix proposals: {len(inc.fix_proposals)}")
            print(f"  Postmortem length: {pm_len}")
            print()

asyncio.run(check())
