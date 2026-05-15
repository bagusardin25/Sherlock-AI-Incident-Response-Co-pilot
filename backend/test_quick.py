"""
Quick test script - test OpenRouter integration langsung tanpa full pipeline
"""
import asyncio
import sys
sys.path.insert(0, ".")

from app.config import settings


async def main():
    print("=" * 50)
    print("🔍 Sherlock - Quick Integration Test")
    print("=" * 50)

    # Check config
    print(f"\nOpenRouter Model: {settings.openrouter_model}")
    print(f"OpenRouter Key: {'✅ configured' if settings.openrouter_api_key else '❌ missing'}")
    print(f"Bob Mock Mode: {settings.bob_mock_mode}")

    if not settings.openrouter_api_key or settings.openrouter_api_key == "your-openrouter-api-key-here":
        print("\n❌ Set SHERLOCK_OPENROUTER_API_KEY di .env dulu!")
        return

    # Test 1: Triage Agent
    print("\n--- Test 1: Triage Agent (OpenRouter) ---")
    from app.agents.triage import triage

    sample_alert = """TypeError: Cannot read property 'quantity' of undefined
    at decrementInventory (src/cart/checkout.ts:42:18)
    at processCheckout (src/cart/checkout.ts:28:5)
    Service: checkout-service, Environment: production
    Occurrences: 47 in last 30 minutes"""

    result = await triage(sample_alert, "test-001")
    print(f"  Severity: {result.severity.value}")
    print(f"  Error Type: {result.error_type.value}")
    print(f"  Service: {result.service}")
    print(f"  Summary: {result.summary}")
    print(f"  Confidence: {result.confidence}")
    print("  ✅ Triage OK!")

    # Test 2: Postmortem Agent (simplified)
    print("\n--- Test 2: Postmortem Agent (OpenRouter) ---")
    from app.agents.postmortem import generate
    from app.models.state import IncidentState, TriageResult, Severity, ErrorType

    state = IncidentState(
        incident_id="test-001",
        raw_input=sample_alert,
        triage=result,
    )

    postmortem = await generate(state, "test-001")
    print(f"  Generated: {len(postmortem)} chars")
    print(f"  Preview: {postmortem[:200]}...")
    print("  ✅ Postmortem OK!")

    print("\n" + "=" * 50)
    print("✅ All tests passed! OpenRouter integration working.")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
