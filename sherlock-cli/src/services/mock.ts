const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface AgentEvent {
  agent_name: string;
  status: "running" | "completed" | "failed";
  message: string;
  data?: Record<string, any>;
}

/**
 * Mock pipeline timeline.
 *
 * Pacing notes:
 *   - `delayMs` is the wait BEFORE the event fires. Larger values between an
 *     agent's completion and the next agent's "running" event give the
 *     orchestration a deliberate, AI-thinking feel rather than an instant
 *     stamp-everything-at-once response.
 *   - Total runtime is ~24 seconds, which is long enough to feel real but
 *     short enough for a 3-minute demo.
 *
 * Confidence values are intentionally varied:
 *   - triage 0.95   (signal classification is the easiest task)
 *   - analyst 0.87  (deeper reasoning carries more uncertainty)
 *   - suspect-file pinpoint 0.91
 */
const MOCK_EVENTS: { event: AgentEvent; delayMs: number }[] = [
  // ── Triage ──────────────────────────────────────────────────────────────
  {
    delayMs: 900,
    event: {
      agent_name: "triage",
      status: "running",
      message: "Classifying incident severity and error type",
    },
  },
  {
    delayMs: 2200,
    event: {
      agent_name: "triage",
      status: "completed",
      message: "Critical severity detected",
      data: {
        severity: "high",
        error_type: "race_condition",
        service: "checkout-service",
        confidence: 0.95,
        summary: "TypeError on async inventory access during checkout",
      },
    },
  },

  // ── Forensics ───────────────────────────────────────────────────────────
  // Longer gap so the eye has time to read the triage block.
  {
    delayMs: 1600,
    event: {
      agent_name: "forensics",
      status: "running",
      message: "Scanning repository history",
    },
  },
  {
    delayMs: 3400,
    event: {
      agent_name: "forensics",
      status: "completed",
      message: "Suspicious commit detected",
      data: {
        commits_scanned: 12,
        suspect_files: ["src/cart/checkout.ts", "src/cart/inventory.ts"],
        suspect_commit: {
          hash: "8f3ab21",
          message: "refactor async payment validation",
          author: "alice",
        },
        evidence: [
          "12 commits within incident time window",
          "checkout.ts modified 3 days before first occurrence",
          "no corresponding test changes in the same PR",
        ],
      },
    },
  },

  // ── Analyst (Bob) ───────────────────────────────────────────────────────
  // The "thinking" step deserves the longest beat.
  {
    delayMs: 1800,
    event: {
      agent_name: "analyst",
      status: "running",
      message: "Reasoning over repository context with IBM Bob",
    },
  },
  {
    delayMs: 4500,
    event: {
      agent_name: "analyst",
      status: "completed",
      message: "Root cause identified",
      data: {
        hypothesis:
          "Race condition introduced during async checkout refactor — inventory fetch is not awaited before decrement, returning a Promise instead of inventory data.",
        evidence: [
          "stack trace correlation: TypeError on undefined.quantity",
          "commit timeline analysis: 8f3ab21 removed `await` keyword",
          "dependency graph: getInventory() returns Promise<Inventory>",
          "no failing test guards this async boundary",
        ],
        confidence: 0.87,
        suspect_files_count: 2,
      },
    },
  },

  // ── Fix ─────────────────────────────────────────────────────────────────
  {
    delayMs: 1500,
    event: {
      agent_name: "fix",
      status: "running",
      message: "Generating patch and regression test",
    },
  },
  {
    delayMs: 3800,
    event: {
      agent_name: "fix",
      status: "completed",
      message: "Patch generated",
      data: {
        pr_title: "fix: await inventory fetch in checkout flow",
        files_modified: ["src/cart/checkout.ts", "src/cart/checkout.test.ts"],
        has_test: true,
        patch:
          "--- a/src/cart/checkout.ts\n" +
          "+++ b/src/cart/checkout.ts\n" +
          "@@ -39,7 +39,7 @@\n" +
          "-  const inventory = getInventory(productId);\n" +
          "+  const inventory = await getInventory(productId);",
      },
    },
  },

  // ── Postmortem ──────────────────────────────────────────────────────────
  {
    delayMs: 1400,
    event: {
      agent_name: "postmortem",
      status: "running",
      message: "Drafting incident report",
    },
  },
  {
    delayMs: 2600,
    event: {
      agent_name: "postmortem",
      status: "completed",
      message: "Incident report completed",
      data: { length: 2400, sections: 6 },
    },
  },

  // ── Pipeline closeout ──────────────────────────────────────────────────
  {
    delayMs: 400,
    event: {
      agent_name: "pipeline",
      status: "completed",
      message: "Investigation complete",
      data: { incident_id: "" },
    },
  },
];

export async function* mockInvestigate(incidentId: string): AsyncGenerator<AgentEvent> {
  for (const item of MOCK_EVENTS) {
    await delay(item.delayMs);
    const event = { ...item.event };
    if (event.agent_name === "pipeline" && event.data) event.data.incident_id = incidentId;
    yield event;
  }
}

export function mockIncidentList() {
  return [
    {
      incident_id: "inc-a1b2c3d4",
      status: "completed",
      triage: {
        severity: "high",
        service: "checkout-service",
        error_type: "race_condition",
      },
      created_at: "2024-05-14T12:34:56Z",
    },
    {
      incident_id: "inc-e5f6g7h8",
      status: "completed",
      triage: {
        severity: "medium",
        service: "auth-service",
        error_type: "timeout",
      },
      created_at: "2024-05-13T09:15:00Z",
    },
    {
      incident_id: "inc-i9j0k1l2",
      status: "processing",
      triage: {
        severity: "critical",
        service: "payment-gateway",
        error_type: "null_pointer",
      },
      created_at: "2024-05-14T14:22:00Z",
    },
  ];
}

export function mockIncidentState(incidentId: string) {
  return {
    incident_id: incidentId,
    status: "completed",
    triage: {
      severity: "high",
      service: "checkout-service",
      error_type: "race_condition",
      summary: "TypeError on async inventory access during checkout",
      confidence: 0.95,
    },
    forensics: {
      recent_commits: [
        { hash: "8f3ab21", message: "refactor async payment validation", author: "alice" },
      ],
      suspect_files: ["src/cart/checkout.ts"],
    },
    root_cause: {
      hypothesis:
        "Race condition introduced during async checkout refactor — inventory fetch is not awaited before decrement, returning a Promise instead of inventory data.",
      evidence: [
        "stack trace correlation: TypeError on undefined.quantity",
        "commit timeline analysis: 8f3ab21 removed `await` keyword",
        "dependency graph: getInventory() returns Promise<Inventory>",
      ],
      root_cause:
        "Race condition in inventory decrement: async fetch result not awaited.",
      suspect_files: [
        {
          path: "src/cart/checkout.ts",
          line_number: 42,
          reason: "Async inventory fetch not awaited",
          confidence: 0.91,
        },
      ],
      confidence: 0.87,
    },
    fix: {
      pr_title: "fix: await inventory fetch in checkout flow",
      patch_unified_diff:
        "--- a/src/cart/checkout.ts\n" +
        "+++ b/src/cart/checkout.ts\n" +
        "@@ -39,7 +39,7 @@\n" +
        " async function decrementInventory(productId: string, quantity: number) {\n" +
        "-  const inventory = getInventory(productId);\n" +
        "+  const inventory = await getInventory(productId);\n" +
        "   if (!inventory) {\n" +
        "     throw new Error(`Product ${productId} not found`);",
      files_modified: ["src/cart/checkout.ts", "src/cart/checkout.test.ts"],
      test_code: "it('should properly await inventory fetch', async () => { ... });",
    },
    postmortem:
      "# Postmortem: Race Condition in Checkout Service\n\n" +
      "## Summary\n" +
      "A race condition in the checkout service caused TypeError exceptions during high-concurrency scenarios.\n\n" +
      "## Root Cause\n" +
      "Missing `await` keyword on async inventory fetch in `decrementInventory()`.\n\n" +
      "## Timeline\n" +
      "- 12:00 UTC — first occurrence detected\n" +
      "- 12:34 UTC — alert triggered (47 occurrences)\n" +
      "- 12:36 UTC — Sherlock analysis initiated\n" +
      "- 12:38 UTC — root cause identified, fix generated\n\n" +
      "## Resolution\n" +
      "Added `await` before `getInventory()` call in checkout.ts:42\n\n" +
      "## Action Items\n" +
      "- [ ] Add async lint rule to prevent missing await\n" +
      "- [ ] Increase test coverage for concurrent checkout scenarios\n" +
      "- [ ] Add circuit breaker for inventory service calls",
  };
}

export function mockPostmortem(incidentId: string) {
  return mockIncidentState(incidentId).postmortem;
}
