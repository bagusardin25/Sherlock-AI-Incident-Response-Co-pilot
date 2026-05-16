import EventSource from "eventsource";
import chalk from "chalk";

import { mockInvestigate, AgentEvent } from "../services/mock.js";
import { submitIncident } from "../services/api.js";
import { useMock } from "../services/client.js";
import { config } from "../config.js";
import {
  agentTag,
  agentDisplayName,
  renderCompletedEvent,
  blank,
  info,
  failure,
  success,
} from "./render.js";
import { setActiveIncident, recordIncident, getSession } from "./session.js";

export interface PipelineResult {
  incidentId: string;
  status: "completed" | "failed";
  triage?: { severity?: string; service?: string; summary?: string };
}

interface RunOptions {
  rawInput: string;
  repoUrl: string;
  /** When true, emit a single concise startup line. Defaults to true. */
  showStartup?: boolean;
}

/** Maximum time (ms) to wait for the SSE pipeline before forcing a timeout. */
const SSE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const isTTY = !!process.stdout.isTTY;

function startRunningLine(rawName: string, message: string) {
  const line = `${agentTag(rawName)} ${chalk.dim(message + "…")}`;
  if (isTTY) {
    process.stdout.write(line);
  } else {
    process.stdout.write(line + "\n");
  }
}

function endRunningLine() {
  if (!isTTY) return;
  process.stdout.write("\r");
  const stream = process.stdout as NodeJS.WriteStream & { clearLine?: (dir: number) => void };
  stream.clearLine?.(0);
}

function elapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Run the resolve pipeline (mock or real backend) and stream output through
 * the clean render module. Updates session.activeIncident and history.
 */
export async function runResolvePipeline(opts: RunOptions): Promise<PipelineResult> {
  const showStartup = opts.showStartup !== false;
  const useMockMode = await useMock();

  if (showStartup) {
    if (useMockMode) {
      info("Local simulation engaged — mock mode");
    }
  }

  const totalStart = Date.now();
  const agentStarts = new Map<string, number>();
  const timings = new Map<string, number>();
  let triageData: any = null;
  let finalIncidentId = "";
  let lastStatus: "completed" | "failed" = "completed";

  const handleEvent = (event: AgentEvent) => {
    if (event.status === "running") {
      agentStarts.set(event.agent_name, Date.now());
      startRunningLine(event.agent_name, event.message);
      return;
    }

    if (event.status === "completed") {
      const start = agentStarts.get(event.agent_name);
      const agentElapsed = start ? Date.now() - start : undefined;
      if (start) timings.set(event.agent_name, Date.now() - start);
      endRunningLine();

      if (event.agent_name === "pipeline") {
        // Pipeline-level completion: surface the incident id and totals separately below.
        if (event.data?.incident_id) finalIncidentId = event.data.incident_id;
        return;
      }

      if (event.agent_name === "triage") triageData = event.data;

      // Append timing to headline if available
      const headline = agentElapsed
        ? `${event.message} ${chalk.dim(`(${elapsed(agentElapsed)})`)}`
        : event.message;
      renderCompletedEvent(event.agent_name, headline, event.data ?? {});
      return;
    }

    if (event.status === "failed") {
      endRunningLine();
      lastStatus = "failed";
      failure(`${agentDisplayName(event.agent_name)} failed: ${event.message}`);
    }
  };

  if (useMockMode) {
    const incidentId = `inc-${Date.now().toString(36).slice(-6)}`;
    finalIncidentId = incidentId;
    for await (const event of mockInvestigate(incidentId)) handleEvent(event);
  } else {
    // Pre-flight auth check: ensure API key is available
    if (!config.apiKey) {
      failure("Authentication required — no API key found.");
      info("Run /auth login to authenticate with your API key.");
      return { incidentId: "", status: "failed" };
    }

    let result: { incident_id: string; stream_url: string };
    try {
      result = await submitIncident({ raw_input: opts.rawInput, repo_url: opts.repoUrl });
    } catch (err: any) {
      const msg = err.message ?? String(err);
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        failure("Authentication failed — your API key may be invalid or expired.");
        info("Run /auth login to re-authenticate.");
      } else {
        failure(`Submission failed: ${msg}`);
      }
      return { incidentId: "", status: "failed" };
    }
    finalIncidentId = result.incident_id;
    await streamSSE(`${config.apiUrl}${result.stream_url}?token=${encodeURIComponent(config.apiKey)}`, handleEvent);
  }

  // Footer summary
  blank();
  const totalSec = elapsed(Date.now() - totalStart);
  const analystMs = timings.get("analyst") ?? timings.get("bob_analyst");
  const fixMs = timings.get("fix");

  if (lastStatus === "completed") {
    success(`Investigation complete · incident ${chalk.cyan(finalIncidentId)} · ${chalk.dim(totalSec)}`);
  } else {
    failure(`Investigation incomplete · incident ${chalk.cyan(finalIncidentId)} · ${chalk.dim(totalSec)}`);
  }

  if (analystMs) info(`  Root cause in ${elapsed(analystMs)} · patch in ${fixMs ? elapsed(fixMs) : "—"}`);

  // Session bookkeeping
  if (finalIncidentId && lastStatus === "completed") {
    setActiveIncident(finalIncidentId);
    recordIncident({
      incidentId: finalIncidentId,
      severity: triageData?.severity,
      service: triageData?.service,
      summary: triageData?.summary,
      timestamp: new Date().toISOString(),
    });
    blank();
    info(`Active incident: ${chalk.cyan(finalIncidentId)}`);
    info(`Next: /fix · /postmortem`);
  }

  return {
    incidentId: finalIncidentId,
    status: lastStatus,
    triage: triageData
      ? {
          severity: triageData.severity,
          service: triageData.service,
          summary: triageData.summary,
        }
      : undefined,
  };
}

/**
 * Stream SSE events from the backend pipeline.
 *
 * Handles three termination signals:
 *   1. Agent event: agent_name === "pipeline" && status === "completed"
 *   2. Backend envelope: {"type": "complete"}
 *   3. Backend envelope: {"type": "error", "message": "..."}
 *
 * Also enforces an overall timeout (SSE_TIMEOUT_MS) so the CLI never hangs
 * indefinitely if the backend stalls.
 */
function streamSSE(url: string, handler: (e: AgentEvent) => void): Promise<void> {
  return new Promise((resolve) => {
    const es = new EventSource(url);
    let resolved = false;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      es.close();
      resolve();
    };

    // Safety net: force-close after SSE_TIMEOUT_MS
    const timer = setTimeout(() => {
      if (!resolved) {
        failure(`Pipeline timed out after ${SSE_TIMEOUT_MS / 1000}s — closing connection.`);
        finish();
      }
    }, SSE_TIMEOUT_MS);

    es.onmessage = (msg: MessageEvent<string>) => {
      try {
        const data = JSON.parse(msg.data);

        // Handle backend termination envelopes
        if (data.type === "complete") {
          finish();
          return;
        }
        if (data.type === "error") {
          failure(`Backend error: ${data.message ?? "unknown"}`);
          finish();
          return;
        }

        // Standard agent event
        const event = data as AgentEvent;
        handler(event);
        if (event.agent_name === "pipeline" && event.status === "completed") {
          finish();
        }
      } catch {
        /* ignore parse errors */
      }
    };

    es.onerror = () => {
      finish();
    };
  });
}

// Suppress unused-import warning in some builds
void getSession;
