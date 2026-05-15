import fs from "fs";
import chalk from "chalk";

import {
  readConfig,
  writeConfig,
  clearConfig,
  maskKey,
  shortPath,
  describeConnection,
  compactHeader,
  CONFIG_FILE_PATH,
} from "../commands/auth.js";

import { useMock } from "../services/client.js";
import { getIncidentState, listIncidents, getPostmortem } from "../services/api.js";
import { mockIncidentList, mockIncidentState, mockPostmortem } from "../services/mock.js";

import { agentTag, blank, failure, info, rule, success, warn } from "./render.js";
import { viewIncidentList, viewIncidentDetail, viewFix, viewPostmortem } from "./views.js";
import { runResolvePipeline } from "./pipeline.js";
import { getSession, refreshAuth } from "./session.js";
import { openUrl } from "../utils/opener.js";

export type DispatchResult = "continue" | "exit";

/**
 * Generic prompt function. The shell injects an inquirer-backed implementation;
 * other surfaces could plug in something else. `mask: true` requests password-style
 * input.
 */
export type AskFn = (question: string, opts?: { mask?: boolean }) => Promise<string>;

type Handler = (args: string[], ask: AskFn) => Promise<DispatchResult>;

// ─── command parsing ──────────────────────────────────────────────────────────

interface ParsedCommand {
  name: string;
  args: string[];
}

export function parseLine(raw: string): ParsedCommand | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("/")) {
    return { name: "_unknown", args: [trimmed] };
  }
  const parts = trimmed.slice(1).split(/\s+/);
  return { name: parts[0]?.toLowerCase() ?? "", args: parts.slice(1) };
}

// ─── dashboard URL resolution ────────────────────────────────────────────────

function dashboardBaseUrl(): string {
  return (
    process.env.SHERLOCK_DASHBOARD_URL ||
    process.env.SHERLOCK_FRONTEND_URL ||
    "http://localhost:3000"
  );
}

// ─── individual handlers ──────────────────────────────────────────────────────

const helpHandler: Handler = async () => {
  blank();
  console.log(chalk.bold.white("  Slash Commands"));
  console.log("");
  console.log(`    ${chalk.cyan("/resolve")} ${chalk.dim("<file>")}        Resolve a production incident`);
  console.log(`    ${chalk.cyan("/status")} ${chalk.dim("[id]")}           List incidents or show detail`);
  console.log(`    ${chalk.cyan("/fix")} ${chalk.dim("[id]")}              Show generated fix`);
  console.log(`    ${chalk.cyan("/postmortem")} ${chalk.dim("[id]")}       Show incident report`);
  console.log(`    ${chalk.cyan("/open")} ${chalk.dim("[id]")}             Open incident in web dashboard`);
  console.log(`    ${chalk.cyan("/history")}                Show this session's incidents`);
  console.log(`    ${chalk.cyan("/agents")}                 Show the multi-agent pipeline`);
  console.log("");
  console.log(`    ${chalk.cyan("/auth login")}             Authenticate the CLI`);
  console.log(`    ${chalk.cyan("/auth status")}            Show authentication status`);
  console.log(`    ${chalk.cyan("/auth logout")}            Remove stored credentials`);
  console.log("");
  console.log(`    ${chalk.cyan("/clear")}                  Clear the screen`);
  console.log(`    ${chalk.cyan("/help")}                   Show this help`);
  console.log(`    ${chalk.cyan("/exit")}                   Leave the shell`);
  console.log("");
  console.log(chalk.dim("  Tip: when an incident is active, /fix /postmortem /open use it automatically."));
  blank();
  return "continue";
};

const exitHandler: Handler = async () => {
  blank();
  info("Session closed.");
  blank();
  return "exit";
};

const clearHandler: Handler = async () => {
  console.clear();
  return "continue";
};

const resolveHandler: Handler = async (args, ask) => {
  let target = args.join(" ").trim();
  if (!target) {
    target = await ask("Enter log file or paste stack trace:");
  }
  if (!target) {
    warn("No input provided.");
    return "continue";
  }

  // Pull optional --repo <url>
  let repoUrl = "https://github.com/org/service";
  const repoMatch = target.match(/--repo\s+(\S+)/);
  if (repoMatch) {
    repoUrl = repoMatch[1];
    target = target.replace(repoMatch[0], "").trim();
  }

  let rawInput: string;
  if (fs.existsSync(target)) {
    try {
      rawInput = fs.readFileSync(target, "utf-8");
    } catch (err: any) {
      failure(`Cannot read ${target}: ${err.message ?? err}`);
      return "continue";
    }
  } else {
    rawInput = target;
  }

  blank();
  await runResolvePipeline({ rawInput, repoUrl });
  blank();
  return "continue";
};

async function resolveIncidentId(args: string[], ask: AskFn, action: string): Promise<string | null> {
  const sess = getSession();
  if (args[0]) return args[0];
  if (sess.activeIncident) return sess.activeIncident;

  const id = (await ask(`Incident ID for ${action}:`)).trim();
  if (!id) return null;
  return id;
}

const statusHandler: Handler = async (args, ask) => {
  const sess = getSession();
  const mock = await useMock();

  // If user passes an id, or has an active incident, show detail.
  // Otherwise, show the list (no need to prompt).
  const id = args[0] ?? sess.activeIncident;

  if (id) {
    let state: any;
    try {
      state = mock ? mockIncidentState(id) : await getIncidentState(id);
    } catch (err: any) {
      failure(`Cannot fetch ${id}: ${err.message ?? err}`);
      return "continue";
    }
    viewIncidentDetail(state);
    return "continue";
  }

  let incidents: any[];
  try {
    incidents = mock ? mockIncidentList() : await listIncidents();
  } catch (err: any) {
    failure(`Cannot list incidents: ${err.message ?? err}`);
    return "continue";
  }
  viewIncidentList(incidents);
  return "continue";
};

const fixHandler: Handler = async (args, ask) => {
  const id = await resolveIncidentId(args, ask, "fix");
  if (!id) {
    warn("No incident ID provided.");
    return "continue";
  }

  const mock = await useMock();
  let state: any;
  try {
    state = mock ? mockIncidentState(id) : await getIncidentState(id);
  } catch (err: any) {
    failure(`Cannot fetch ${id}: ${err.message ?? err}`);
    return "continue";
  }
  viewFix(id, state);
  return "continue";
};

const postmortemHandler: Handler = async (args, ask) => {
  const id = await resolveIncidentId(args, ask, "postmortem");
  if (!id) {
    warn("No incident ID provided.");
    return "continue";
  }

  const mock = await useMock();
  let text = "";
  try {
    if (mock) {
      text = mockPostmortem(id);
    } else {
      try {
        const r = await getPostmortem(id);
        text = r.postmortem;
      } catch {
        const state = await getIncidentState(id);
        text = state.postmortem ?? "";
      }
    }
  } catch (err: any) {
    failure(`Cannot fetch postmortem: ${err.message ?? err}`);
    return "continue";
  }
  viewPostmortem(id, text);
  return "continue";
};

const historyHandler: Handler = async () => {
  const sess = getSession();
  blank();
  if (!sess.history.length) {
    info("No incidents this session yet.");
    blank();
    return "continue";
  }
  console.log(chalk.bold.white(`  Session history (${sess.history.length})`));
  for (const h of sess.history) {
    const active = sess.activeIncident === h.incidentId ? chalk.green(" (active)") : "";
    const sev = h.severity ? chalk.yellow(h.severity.toUpperCase().padEnd(8)) : chalk.dim("—".padEnd(8));
    console.log(
      `  ${chalk.cyan(h.incidentId.padEnd(16))}  ${sev}  ${(h.service ?? "—").padEnd(20)}${active}`,
    );
  }
  blank();
  return "continue";
};

const openHandler: Handler = async (args, ask) => {
  const sess = getSession();
  const id = args[0] ?? sess.activeIncident;
  const base = dashboardBaseUrl();
  const url = id ? `${base.replace(/\/+$/, "")}/incidents/${id}` : base;

  blank();
  if (id) {
    info(`Opening ${chalk.cyan(id)} in dashboard…`);
  } else {
    info("Opening dashboard…");
  }
  info(chalk.dim(url));

  const ok = openUrl(url);
  if (!ok) {
    failure("Could not launch browser. Open the URL above manually.");
  } else {
    success("Launched.");
  }
  blank();
  // ask is unused here but kept for handler signature uniformity
  void ask;
  return "continue";
};

const agentsHandler: Handler = async () => {
  blank();
  console.log(chalk.bold.white("  Multi-agent Pipeline"));
  rule(40);
  const agents: Array<[string, string, string]> = [
    ["TRIAGE", "Severity, service, error type classification", " "],
    ["FORENSICS", "Git history, blame, suspect commits & files", " "],
    ["ANALYST", "Code-level reasoning over the repo with IBM Bob", "⭐"],
    ["FIX", "Generate unified-diff patch + regression test (Bob)", "⭐"],
    ["POSTMORTEM", "Aggregate findings into incident report", " "],
  ];
  for (const [name, desc, marker] of agents) {
    console.log(`  ${chalk.cyan.bold(`[${name.padEnd(11)}]`)} ${marker} ${chalk.white(desc)}`);
  }
  blank();
  console.log(chalk.dim("  ⭐ = Powered by IBM Bob repository intelligence"));
  blank();
  return "continue";
};

// ─── auth slash commands ──────────────────────────────────────────────────────

const authHandler: Handler = async (args, ask) => {
  const sub = args[0]?.toLowerCase();
  switch (sub) {
    case "login":
      return authLogin(args.slice(1), ask);
    case "status":
      return authStatus();
    case "logout":
      return authLogout();
    default:
      warn("Usage: /auth <login|status|logout>");
      return "continue";
  }
};

async function authLogin(args: string[], ask: AskFn): Promise<DispatchResult> {
  let apiUrl = "http://localhost:8000";
  const idx = args.findIndex((a) => a === "--api-url");
  if (idx !== -1 && args[idx + 1]) apiUrl = args[idx + 1];

  compactHeader("Sherlock CLI Authentication");
  console.log("");
  console.log(chalk.dim("API key source:"));
  console.log(chalk.dim("Dashboard → Settings → API Keys"));
  console.log("");

  const apiKey = await ask("Enter API key:", { mask: true });
  if (!apiKey || (!apiKey.startsWith("sk_sherlock_") && !apiKey.startsWith("sk-"))) {
    blank();
    failure("Invalid API key format");
    info("Expected prefix: sk_sherlock_…");
    blank();
    return "continue";
  }

  writeConfig({ apiKey, apiUrl });
  await refreshAuth();

  blank();
  success("Authentication complete");
  info(`Saved to ${shortPath(CONFIG_FILE_PATH)}`);
  info(describeConnection(apiUrl));
  blank();
  return "continue";
}

async function authStatus(): Promise<DispatchResult> {
  const cfg = readConfig();
  compactHeader("Sherlock CLI · Auth Status");
  if (cfg.apiKey) {
    const url = cfg.apiUrl || "http://localhost:8000";
    blank();
    success("Authenticated");
    console.log(chalk.dim("Key       ") + maskKey(cfg.apiKey));
    console.log(chalk.dim("Endpoint  ") + url);
    console.log(chalk.dim("Config    ") + shortPath(CONFIG_FILE_PATH));
    console.log(chalk.dim("Status    ") + describeConnection(url));
    blank();
  } else {
    blank();
    warn("Not authenticated");
    info("Run /auth login");
    blank();
  }
  return "continue";
}

async function authLogout(): Promise<DispatchResult> {
  compactHeader("Sherlock CLI · Logout");
  blank();
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    clearConfig();
    await refreshAuth();
    success("Credentials removed");
  } else {
    info("No credentials found");
  }
  blank();
  return "continue";
}

// ─── main dispatcher ──────────────────────────────────────────────────────────

const HANDLERS: Record<string, Handler> = {
  help: helpHandler,
  "?": helpHandler,
  exit: exitHandler,
  quit: exitHandler,
  q: exitHandler,
  clear: clearHandler,
  cls: clearHandler,
  resolve: resolveHandler,
  status: statusHandler,
  fix: fixHandler,
  postmortem: postmortemHandler,
  history: historyHandler,
  open: openHandler,
  agents: agentsHandler,
  auth: authHandler,
};

export async function dispatchCommand(line: string, ask: AskFn): Promise<DispatchResult> {
  const parsed = parseLine(line);
  if (!parsed) return "continue";
  if (parsed.name === "_unknown") {
    warn(`Unknown input. Commands start with ${chalk.cyan("/")}, e.g. ${chalk.cyan("/help")}.`);
    return "continue";
  }

  const handler = HANDLERS[parsed.name];
  if (!handler) {
    warn(`Unknown command: /${parsed.name}. Type /help for the list.`);
    return "continue";
  }
  try {
    return await handler(parsed.args, ask);
  } catch (err: any) {
    failure(`Command failed: ${err.message ?? err}`);
    return "continue";
  }
}

// agentTag is referenced by viewPostmortem at runtime; suppress unused-import warning.
void agentTag;
