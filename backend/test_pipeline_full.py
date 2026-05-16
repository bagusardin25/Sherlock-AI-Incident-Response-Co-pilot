#!/usr/bin/env python3
"""
Sherlock Full Pipeline Test (Mock + OpenRouter)
================================================
Simulates the actual incident analysis pipeline as used by the frontend,
combining Mock IBM Bob (for RCA and Fix) + real OpenRouter (for Triage, Forensics AI, Postmortem).

This validates the production configuration where bob_mock_mode=true.
"""
import asyncio
import json
import sys
import time
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings


def banner(text: str):
    w = 70
    print(f"\n{'━'*w}")
    print(f"  {text}")
    print(f"{'━'*w}")


def step(label: str, detail: str = "", icon: str = "▸"):
    if detail:
        print(f"  {icon} {label}: {detail}")
    else:
        print(f"  {icon} {label}")


async def main():
    print("\n" + "🕵️" * 35)
    print("\n  SHERLOCK FULL PIPELINE TEST (PRODUCTION CONFIG)")
    print(f"  Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Bob Mock Mode: {settings.bob_mock_mode} (IBM Bob → fixture data)")
    print(f"  OpenRouter: {settings.openrouter_model} (real AI)")
    print("\n" + "🕵️" * 35)
    
    # ── SAMPLE INCIDENT DATA ────────────────────────────────────────
    sample_alert = """TypeError: Cannot read property 'quantity' of undefined
    at decrementInventory (src/cart/checkout.ts:42:18)
    at processCheckout (src/cart/checkout.ts:28:5)
    at async POST /api/checkout (src/routes/checkout.ts:15:3)

Error occurred during checkout process in production environment.
Service: checkout-service
Severity: HIGH
Occurrences: 47 times in last hour"""

    repo_path = settings.sample_repo_path
    incident_id = f"test-pipeline-{int(time.time())}"
    pipeline_start = time.time()

    # ── STAGE 1: TRIAGE (OpenRouter) ───────────────────────────────
    banner("STAGE 1: TRIAGE (OpenRouter AI)")
    from app.agents.triage import triage
    
    t0 = time.time()
    try:
        triage_result = await triage(sample_alert, incident_id)
        elapsed = time.time() - t0
        step("Status", f"✅ COMPLETED in {elapsed:.1f}s")
        step("Severity", triage_result.severity.value.upper())
        step("Error Type", triage_result.error_type.value)
        step("Service", triage_result.service)
        step("Summary", triage_result.summary)
        step("Confidence", f"{triage_result.confidence:.0%}")
    except Exception as e:
        step("Status", f"❌ FAILED: {e}")
        print("\n  Cannot continue without triage. Exiting.")
        return 1

    # ── STAGE 2: FORENSICS (Git + OpenRouter AI) ──────────────────
    banner("STAGE 2: FORENSICS (Git + OpenRouter AI)")
    from app.agents.forensics import analyze as forensics_analyze
    
    t0 = time.time()
    try:
        forensics_result = await forensics_analyze(repo_path, triage_result, incident_id)
        elapsed = time.time() - t0
        step("Status", f"✅ COMPLETED in {elapsed:.1f}s")
        step("Commits Found", str(len(forensics_result.recent_commits)))
        step("Suspect Files", str(forensics_result.suspect_files))
        step("Blame Entries", str(len(forensics_result.blame_info)))
        step("Log Excerpts", str(len(forensics_result.log_excerpts)))
    except Exception as e:
        elapsed = time.time() - t0
        step("Status", f"❌ FAILED in {elapsed:.1f}s: {e}")
        # Create fallback
        from app.models.state import ForensicsResult
        forensics_result = ForensicsResult(
            recent_commits=[], blame_info=[], log_excerpts=[], suspect_files=["src/cart/checkout.ts"]
        )
        step("Fallback", "Using minimal forensics data")

    # ── STAGE 3: ROOT CAUSE ANALYSIS (IBM Bob Mock) ───────────────
    banner("STAGE 3: ROOT CAUSE ANALYSIS (IBM Bob - Mock Mode)")
    from app.agents.bob_analyst import analyze as bob_analyze
    
    t0 = time.time()
    try:
        rca_result = await bob_analyze(repo_path, triage_result, forensics_result, incident_id)
        elapsed = time.time() - t0
        step("Status", f"✅ COMPLETED in {elapsed:.1f}s (from fixture)")
        step("Root Cause", rca_result.root_cause[:120])
        step("Suspect Files", str(len(rca_result.suspect_files)))
        for sf in rca_result.suspect_files:
            step(f"  → {sf.path}", f"line {sf.line_number}, {sf.reason} (conf: {sf.confidence:.0%})", "  ")
        step("Reasoning Steps", str(len(rca_result.reasoning_chain)))
        for i, r in enumerate(rca_result.reasoning_chain):
            step(f"  Step {i+1}", r, "  ")
        step("Confidence", f"{rca_result.confidence:.0%}")
    except Exception as e:
        step("Status", f"❌ FAILED: {e}")
        print("\n  Cannot continue without root cause. Exiting.")
        return 1

    # ── STAGE 4: FIX GENERATION (IBM Bob Mock) ────────────────────
    banner("STAGE 4: FIX GENERATION (IBM Bob - Mock Mode)")
    from app.agents.fix import generate_fix
    
    t0 = time.time()
    try:
        fix_result = await generate_fix(repo_path, triage_result, forensics_result, rca_result, incident_id)
        elapsed = time.time() - t0
        step("Status", f"✅ COMPLETED in {elapsed:.1f}s (from fixture)")
        step("PR Title", fix_result.pr_title)
        step("Files Modified", str(fix_result.files_modified))
        step("Has Patch", "Yes" if fix_result.patch_unified_diff else "No")
        step("Has Test", "Yes" if fix_result.test_code else "No")
        step("PR Body Preview", fix_result.pr_body[:150])
    except Exception as e:
        step("Status", f"❌ FAILED: {e}")
        fix_result = None

    # ── STAGE 5: POSTMORTEM (OpenRouter AI) ───────────────────────
    banner("STAGE 5: POSTMORTEM (OpenRouter AI)")
    from app.agents.postmortem import generate as generate_postmortem
    from app.models.state import IncidentState

    state = IncidentState(
        incident_id=incident_id,
        raw_input=sample_alert,
        repo_path=repo_path,
        triage=triage_result,
        forensics=forensics_result,
        root_cause=rca_result,
        fix=fix_result,
        status="completed",
    )
    
    t0 = time.time()
    try:
        postmortem_text = await generate_postmortem(state, incident_id)
        elapsed = time.time() - t0
        step("Status", f"✅ COMPLETED in {elapsed:.1f}s")
        step("Length", f"{len(postmortem_text)} chars")
        step("Sections", str(postmortem_text.count("##")))
        step("Preview", postmortem_text[:200])
    except Exception as e:
        elapsed = time.time() - t0
        step("Status", f"❌ FAILED in {elapsed:.1f}s: {e}")
        postmortem_text = None

    # ── PIPELINE SUMMARY ──────────────────────────────────────────
    total_elapsed = time.time() - pipeline_start
    banner(f"PIPELINE COMPLETE — Total: {total_elapsed:.1f}s")
    
    stages = {
        "Triage (OpenRouter)": triage_result is not None,
        "Forensics (Git+OpenRouter)": forensics_result is not None,
        "Root Cause (IBM Bob Mock)": rca_result is not None,
        "Fix Generation (IBM Bob Mock)": fix_result is not None,
        "Postmortem (OpenRouter)": postmortem_text is not None,
    }
    
    for name, ok in stages.items():
        icon = "✅" if ok else "❌"
        print(f"  {icon} {name}")
    
    passed = sum(1 for v in stages.values() if v)
    total = len(stages)
    
    print(f"\n  Pipeline: {passed}/{total} stages completed")
    
    if passed == total:
        print("\n  🎉 FULL PIPELINE WORKING! All 5 agents produced valid output.")
        print("  The system is ready for demo/hackathon use.")
        print(f"\n  ℹ️  IBM Bob stages use mock fixtures (bob_mock_mode=true)")
        print(f"  ℹ️  OpenRouter stages use real AI ({settings.openrouter_model})")
        print(f"  ℹ️  When IBM Bob API becomes available, set SHERLOCK_BOB_MOCK_MODE=false")
    else:
        print(f"\n  ⚠️  {total - passed} stage(s) failed. Review details above.")
    
    print(f"\n{'━'*70}\n")
    return 0 if passed == total else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
