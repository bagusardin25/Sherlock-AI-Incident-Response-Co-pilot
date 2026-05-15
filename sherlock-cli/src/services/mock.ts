const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface AgentEvent {
  agent_name: string;
  status: "running" | "completed" | "failed";
  message: string;
  data?: Record<string, any>;
}

const MOCK_EVENTS: { event: AgentEvent; delayMs: number }[] = [
  {
    delayMs: 800,
    event: { agent_name: "triage", status: "running", message: "Analyzing incident severity and type..." },
  },
  {
    delayMs: 2000,
    event: {
      agent_name: "triage", status: "completed",
      message: "Triage completed: HIGH severity, race_condition",
      data: { severity: "high", error_type: "race_condition", service: "checkout-service", confidence: 0.92 },
    },
  },
  {
    delayMs: 500,
    event: { agent_name: "forensics", status: "running", message: "Gathering git history and code context..." },
  },
  {
    delayMs: 3000,
    event: {
      agent_name: "forensics", status: "completed",
      message: "Forensics completed: 12 commits, 2 suspect files",
      data: { commits_count: 12, suspect_files: ["src/cart/checkout.ts"], suspect_commit: "a81bc92 - refactor checkout validation" },
    },
  },
  {
    delayMs: 500,
    event: { agent_name: "bob_analyst", status: "running", message: "🧠 Bob analyzing codebase for root cause..." },
  },
  {
    delayMs: 4000,
    event: {
      agent_name: "bob_analyst", status: "completed",
      message: "Root cause identified: Race condition in inventory decrement logic",
      data: {
        root_cause: "Race condition in inventory decrement logic. The inventory fetch operation is asynchronous but the decrement operation does not await the result.",
        suspect_files_count: 2, confidence: 0.92,
      },
    },
  },
  {
    delayMs: 500,
    event: { agent_name: "fix", status: "running", message: "🛠️ Generating code fix with Bob..." },
  },
  {
    delayMs: 3500,
    event: {
      agent_name: "fix", status: "completed",
      message: "Fix generated: fix: add await to inventory fetch in checkout flow",
      data: {
        pr_title: "fix: add await to inventory fetch in checkout flow",
        files_modified: ["src/cart/checkout.ts", "src/cart/checkout.test.ts"],
        has_test: true,
        patch: "--- a/src/cart/checkout.ts\n+++ b/src/cart/checkout.ts\n@@ -39,7 +39,7 @@\n-  const inventory = getInventory(productId);\n+  const inventory = await getInventory(productId);",
      },
    },
  },
  {
    delayMs: 500,
    event: { agent_name: "postmortem", status: "running", message: "📝 Generating postmortem document..." },
  },
  {
    delayMs: 2500,
    event: {
      agent_name: "postmortem", status: "completed",
      message: "Postmortem document generated",
      data: { length: 2400, sections: 6 },
    },
  },
  {
    delayMs: 300,
    event: { agent_name: "pipeline", status: "completed", message: "Incident analysis pipeline completed successfully", data: { incident_id: "" } },
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
    { incident_id: "inc-a1b2c3d4", status: "completed", triage: { severity: "high", service: "checkout-service", error_type: "race_condition" }, created_at: "2024-05-14T12:34:56Z" },
    { incident_id: "inc-e5f6g7h8", status: "completed", triage: { severity: "medium", service: "auth-service", error_type: "timeout" }, created_at: "2024-05-13T09:15:00Z" },
    { incident_id: "inc-i9j0k1l2", status: "processing", triage: { severity: "critical", service: "payment-gateway", error_type: "null_pointer" }, created_at: "2024-05-14T14:22:00Z" },
  ];
}

export function mockIncidentState(incidentId: string) {
  return {
    incident_id: incidentId,
    status: "completed",
    triage: { severity: "high", service: "checkout-service", error_type: "race_condition", summary: "Race condition in checkout flow", confidence: 0.92 },
    forensics: { recent_commits: [{ hash: "a81bc92", message: "refactor checkout validation", author: "alice" }], suspect_files: ["src/cart/checkout.ts"] },
    root_cause: {
      root_cause: "Race condition in inventory decrement logic. The inventory fetch operation is asynchronous but the decrement operation does not await the result, causing undefined access.",
      suspect_files: [{ path: "src/cart/checkout.ts", line_number: 42, reason: "Async inventory fetch not awaited", confidence: 0.95 }],
      confidence: 0.92,
    },
    fix: {
      pr_title: "fix: add await to inventory fetch in checkout flow",
      patch_unified_diff: "--- a/src/cart/checkout.ts\n+++ b/src/cart/checkout.ts\n@@ -39,7 +39,7 @@\n async function decrementInventory(productId: string, quantity: number) {\n   // Fetch current inventory\n-  const inventory = getInventory(productId);\n+  const inventory = await getInventory(productId);\n   \n   if (!inventory) {\n     throw new Error(`Product ${productId} not found`);",
      files_modified: ["src/cart/checkout.ts", "src/cart/checkout.test.ts"],
      test_code: "it('should properly await inventory fetch', async () => { ... });",
    },
    postmortem: "# Postmortem: Race Condition in Checkout Service\n\n## Summary\nA race condition in the checkout service caused TypeError exceptions during high-concurrency scenarios.\n\n## Root Cause\nMissing `await` keyword on async inventory fetch in `decrementInventory()`.\n\n## Timeline\n- 12:00 UTC - First occurrence detected\n- 12:34 UTC - Alert triggered (47 occurrences)\n- 12:36 UTC - Sherlock analysis initiated\n- 12:38 UTC - Root cause identified & fix generated\n\n## Resolution\nAdded `await` before `getInventory()` call in checkout.ts:42\n\n## Action Items\n- [ ] Add async linting rules to prevent missing await\n- [ ] Increase test coverage for concurrent checkout scenarios\n- [ ] Add circuit breaker for inventory service calls",
  };
}

export function mockPostmortem(incidentId: string) {
  return mockIncidentState(incidentId).postmortem;
}
