#!/usr/bin/env python3
"""
Sherlock AI Integration Test
=============================
Tests both IBM Bob API and OpenRouter API integrations end-to-end.
Verifies:
  1. IBM Bob API connectivity and response parsing (RCA + Fix)
  2. OpenRouter API connectivity and response parsing (Triage + Forensics AI + Postmortem)
  3. Full pipeline execution with real AI (no mock mode)
"""
import asyncio
import json
import sys
import time
import os
from pathlib import Path
from datetime import datetime

# Make sure we can import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings


def print_header(title: str):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")


def print_step(step: str, status: str = "...", icon: str = "🔍"):
    print(f"\n{icon} [{status}] {step}")


def print_result(label: str, value, indent: int = 2):
    prefix = " " * indent
    if isinstance(value, str) and len(value) > 120:
        value = value[:120] + "..."
    print(f"{prefix}• {label}: {value}")


async def test_openrouter_connectivity():
    """Test 1: Can we reach OpenRouter API and get structured responses?"""
    print_header("TEST 1: OpenRouter API (Triage Agent)")
    
    from app.openrouter_client import chat_completion
    from app.models.state import TriageResult

    if not settings.openrouter_api_key:
        print_step("OpenRouter API Key", "MISSING", "❌")
        print("  Set SHERLOCK_OPENROUTER_API_KEY in your .env file")
        return False

    print_step("API Key", f"...{settings.openrouter_api_key[-8:]}", "🔑")
    print_step("Model", settings.openrouter_model, "🧠")
    
    sample_alert = """TypeError: Cannot read property 'quantity' of undefined
    at decrementInventory (src/cart/checkout.ts:42:18)
    at processCheckout (src/cart/checkout.ts:28:5)
    Service: checkout-service
    Severity: HIGH
    Occurrences: 47 times in last hour"""

    print_step("Calling OpenRouter for Triage", "IN PROGRESS", "⏳")
    start = time.time()
    
    try:
        result = await chat_completion(
            prompt=f"Analyze this incident alert and classify it:\n\n{sample_alert}",
            system_prompt="""You are an expert incident triage agent. Given a raw alert or error, classify it accurately.
You must respond with a JSON object containing:
- severity: one of "low", "medium", "high", "critical"
- service: the service/component name affected
- error_type: one of "null_pointer", "race_condition", "timeout", "memory_leak", "logic_error", "unknown"
- summary: a concise one-line summary of the incident
- confidence: float 0.0-1.0 indicating your confidence""",
            output_schema=TriageResult,
            correlation_id="test-openrouter",
        )
        elapsed = time.time() - start
        
        print_step(f"OpenRouter Triage Response ({elapsed:.1f}s)", "SUCCESS", "✅")
        print_result("Severity", result.severity.value)
        print_result("Error Type", result.error_type.value)
        print_result("Service", result.service)
        print_result("Summary", result.summary)
        print_result("Confidence", f"{result.confidence:.0%}")
        
        # Validate output makes sense
        assert result.severity.value in ["high", "critical"], f"Expected high/critical severity, got {result.severity.value}"
        assert result.confidence > 0.5, f"Confidence too low: {result.confidence}"
        print_step("Output validation", "PASSED", "✅")
        return True
        
    except Exception as e:
        elapsed = time.time() - start
        print_step(f"OpenRouter Triage ({elapsed:.1f}s)", "FAILED", "❌")
        print(f"  Error: {e}")
        return False


async def test_bob_api_connectivity():
    """Test 2: Can we reach IBM Bob API and get structured responses?"""
    print_header("TEST 2: IBM Bob API (Root Cause Analyst)")
    
    from app.bob_client import BobClient
    from app.models.state import RootCauseAnalysis

    # Temporarily create a non-mock client
    client = BobClient()
    
    if not client.api_key:
        print_step("IBM Bob API Key", "MISSING", "❌")
        print("  Set SHERLOCK_BOB_API_KEY in your .env file")
        return False, None

    print_step("API Key", f"...{client.api_key[-8:]}", "🔑")
    print_step("API URL", client.api_url, "🌐")
    print_step("Model", client.model, "🧠")
    print_step("Timeout", f"{client.timeout}s", "⏱️")
    print_step("Mock Mode (current)", str(client.mock_mode), "🎭")
    
    # Force non-mock for this test
    original_mock = client.mock_mode
    client.mock_mode = False
    
    prompt = """Analyze this production incident and identify the root cause.

## Incident Summary
Severity: HIGH
Error Type: Null Pointer
Service: checkout-service
Summary: TypeError accessing 'quantity' property on undefined object during checkout

## Recent Changes (Git History)
- abc1234 by alice (2026-05-10): refactor: extract inventory fetch to async helper
- def5678 by bob (2026-05-09): feat: add batch checkout support

## Suspect Files
- src/cart/checkout.ts

## Your Task
Provide:
1. root_cause: Specific code-level root cause hypothesis
2. suspect_files: Files involved with path, line_number (if known), reason, and confidence (0-1)
3. reasoning_chain: Step-by-step reasoning referencing specific code patterns and changes
4. confidence: Overall confidence (0.0-1.0)"""

    print_step("Calling IBM Bob API for Root Cause Analysis", "IN PROGRESS", "⏳")
    start = time.time()
    
    try:
        result = await client.ask_bob(
            prompt=prompt,
            repo_path=".",
            output_schema=RootCauseAnalysis,
            system_prompt="You are IBM Bob, performing root cause analysis on production incidents.",
            correlation_id="test-bob-rca",
        )
        elapsed = time.time() - start
        
        print_step(f"IBM Bob RCA Response ({elapsed:.1f}s)", "SUCCESS", "✅")
        print_result("Root Cause", result.root_cause)
        print_result("Suspect Files", len(result.suspect_files))
        for sf in result.suspect_files:
            print_result(f"  → {sf.path}", f"line {sf.line_number}, confidence {sf.confidence:.0%}", 4)
        print_result("Reasoning Steps", len(result.reasoning_chain))
        for i, r in enumerate(result.reasoning_chain[:3]):
            print_result(f"  Step {i+1}", r, 4)
        print_result("Overall Confidence", f"{result.confidence:.0%}")
        
        # Validate
        assert result.confidence > 0.3, f"Confidence too low: {result.confidence}"
        assert len(result.root_cause) > 20, "Root cause too short"
        print_step("Output validation", "PASSED", "✅")
        
        client.mock_mode = original_mock
        return True, result
        
    except Exception as e:
        elapsed = time.time() - start
        print_step(f"IBM Bob RCA ({elapsed:.1f}s)", "FAILED", "❌")
        print(f"  Error: {e}")
        client.mock_mode = original_mock
        return False, None


async def test_bob_fix_generation():
    """Test 3: Can IBM Bob generate fix proposals?"""
    print_header("TEST 3: IBM Bob API (Fix Generation)")
    
    from app.bob_client import BobClient
    from app.models.state import FixProposal

    client = BobClient()
    if not client.api_key:
        print_step("Skipped (no API key)", "SKIP", "⏭️")
        return False
    
    original_mock = client.mock_mode
    client.mock_mode = False

    prompt = """Generate a production-ready code fix for this incident.

## Incident Context
Severity: HIGH
Error Type: Null Pointer
Service: checkout-service

## Root Cause
Missing await on async inventory fetch causing undefined access.

## Suspect Files
- src/cart/checkout.ts (line 42): Async inventory fetch not awaited

## Required Output
1. patch_unified_diff: Unified diff fixing the root cause
2. test_code: Regression test (or null)
3. pr_title: Concise PR title
4. pr_body: PR description
5. files_modified: List of file paths modified"""

    print_step("Calling IBM Bob API for Fix Generation", "IN PROGRESS", "⏳")
    start = time.time()
    
    try:
        result = await client.ask_bob(
            prompt=prompt,
            repo_path=".",
            output_schema=FixProposal,
            system_prompt="You are IBM Bob, generating production-ready code fixes.",
            correlation_id="test-bob-fix",
        )
        elapsed = time.time() - start
        
        print_step(f"IBM Bob Fix Response ({elapsed:.1f}s)", "SUCCESS", "✅")
        print_result("PR Title", result.pr_title)
        print_result("Files Modified", result.files_modified)
        print_result("Has Patch", "Yes" if result.patch_unified_diff else "No")
        print_result("Has Test", "Yes" if result.test_code else "No")
        print_result("PR Body Length", f"{len(result.pr_body)} chars")

        assert len(result.pr_title) > 5, "PR title too short"
        assert len(result.patch_unified_diff) > 10, "Patch too short"
        print_step("Output validation", "PASSED", "✅")
        
        client.mock_mode = original_mock
        return True
        
    except Exception as e:
        elapsed = time.time() - start
        print_step(f"IBM Bob Fix ({elapsed:.1f}s)", "FAILED", "❌")
        print(f"  Error: {e}")
        client.mock_mode = original_mock
        return False


async def test_openrouter_postmortem():
    """Test 4: Can OpenRouter generate postmortem?"""
    print_header("TEST 4: OpenRouter API (Postmortem Generation)")
    
    from app.openrouter_client import chat_completion

    if not settings.openrouter_api_key:
        print_step("Skipped (no API key)", "SKIP", "⏭️")
        return False

    prompt = """Generate a comprehensive incident postmortem based on this data:

Incident ID: test-inc-001
Raw Alert:
TypeError: Cannot read property 'quantity' of undefined at checkout.ts:42

Triage: severity=high, error_type=null_pointer, service=checkout-service
Root Cause: Missing await on async inventory fetch causing undefined access
Fix PR Title: fix: add await to inventory fetch in checkout flow
Confidence: 92%"""

    print_step("Calling OpenRouter for Postmortem", "IN PROGRESS", "⏳")
    start = time.time()
    
    try:
        result = await chat_completion(
            prompt=prompt,
            system_prompt="You are an expert SRE writing a comprehensive incident postmortem in Markdown.",
            correlation_id="test-postmortem",
        )
        elapsed = time.time() - start
        
        print_step(f"Postmortem Response ({elapsed:.1f}s)", "SUCCESS", "✅")
        print_result("Length", f"{len(result)} chars")
        print_result("Sections", result.count("##"))
        # Show first 200 chars
        print_result("Preview", result[:200])
        
        assert len(result) > 100, "Postmortem too short"
        assert "##" in result, "No markdown sections found"
        print_step("Output validation", "PASSED", "✅")
        return True
        
    except Exception as e:
        elapsed = time.time() - start
        print_step(f"Postmortem ({elapsed:.1f}s)", "FAILED", "❌")
        print(f"  Error: {e}")
        return False


async def main():
    print("\n" + "🔬" * 35)
    print("\n  SHERLOCK AI INTEGRATION TEST SUITE")
    print(f"  Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Bob Mock Mode (env): {settings.bob_mock_mode}")
    print(f"  Bob API URL: {settings.bob_api_url}")
    print(f"  OpenRouter Model: {settings.openrouter_model}")
    print("\n" + "🔬" * 35)
    
    results = {}
    
    # Test 1: OpenRouter (Triage)
    results["openrouter_triage"] = await test_openrouter_connectivity()
    
    # Test 2: IBM Bob (Root Cause)
    bob_ok, rca_result = await test_bob_api_connectivity()
    results["bob_rca"] = bob_ok
    
    # Test 3: IBM Bob (Fix)
    results["bob_fix"] = await test_bob_fix_generation()
    
    # Test 4: OpenRouter (Postmortem)
    results["openrouter_postmortem"] = await test_openrouter_postmortem()
    
    # Summary
    print_header("TEST SUMMARY")
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    for test_name, success in results.items():
        icon = "✅" if success else "❌"
        status = "PASSED" if success else "FAILED"
        print(f"  {icon} {test_name}: {status}")
    
    print(f"\n  Total: {total} | Passed: {passed} | Failed: {failed}")
    
    if failed == 0:
        print("\n  🎉 ALL AI INTEGRATIONS ARE WORKING CORRECTLY!")
    elif results.get("bob_rca") and results.get("bob_fix"):
        print("\n  ⚠️ IBM Bob (core) is working. Some supporting agents need attention.")
    else:
        print("\n  ⚠️ Some integrations need attention. Check the details above.")
    
    print(f"\n{'='*70}\n")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
