import readline from "readline";
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

import { blank, failure, info, success, warn } from "./render.js";
import { viewIncidentList, viewIncidentDetail, viewFix, viewPostmortem } from "./views.js";
import { runResolvePipeline } from "./pipeline.js";
import { getSession, refreshAuth } from "./session.js";
import { openUrl } from "../utils/opener.js";

export type DispatchResult = "continue" | "exit";

type Handler = (args: string[], rl: readline.Interface) => Promise<DispatchResult>;

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

// ─── prompt helper that reuses the live readline interface ───────────────────

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
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

const resolveHandler: Handler = async (args) => {
  if (args.length === 0) {
    warn("Usage: /resolve <file-or-text> [--repo <url>]");
    return "continue";
  }

  // Pull optional --repo <url>
  let repoUrl = "https://github.com/org/service";
  const repoIdx = args.findIndex((a) => a === "--repo");
  if (repoIdx !== -1 && args[repoIdx + 1]) {
    repoUrl = args[repoIdx + 1];
    args.splice(repoIdx, 2);
  }

  const target = args.join(" ");
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

const statusHandler: Handler = async (args) => {
  const sess = getSession();
  const id = args[0] ?? sess.activeIncident;
  const mock = await useMock();

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

const fixHandler: Handler = async (args) => {
  const sess = getSession();
  const id = args[0] ?? sess.activeIncident;
  if (!id) {
    warn("No active incident. Run /resolve <file> or /fix <incident-id>.");
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

const postmortemHandler: Handler = async (args) => {
  const sess = getSession();
  const id = args[0] ?? sess.activeIncident;
  if (!id) {
    warn("No active incident. Run /resolve <file> or /postmortem <incident-id>.");
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

const openHandler: Handler = async (args) => {
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
  return "continue";
};

// ─── auth slash commands ──────────────────────────────────────────────────────

const authHandler: Handler = async (args, rl) => {
  const sub = args[0]?.toLowerCase();
  switch (sub) {
    case "login":
      return authLogin(args.slice(1), rl);
    case "status":
      return authStatus();
    case "logout":
      return authLogout();
    default:
      warn("Usage: /auth <login|status|logout>");
      return "continue";
  }
};

async function authLogin(args: string[], rl: readline.Interface): Promise<DispatchResult> {
  let apiUrl = "http://localhost:8000";
  const idx = args.findIndex((a) => a === "--api-url");
  if (idx !== -1 && args[idx + 1]) apiUrl = args[idx + 1];

  compactHeader("Sherlock CLI Authentication");
  console.log("");
  console.log(chalk.dim("API key source:"));
  console.log(chalk.dim("Dashboard → Settings → API Keys"));
  console.log("");

  const apiKey = await ask(rl, "Enter API key: ");
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
    info("Run: /auth login");
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
  auth: authHandler,
};

export async function dispatchCommand(line: string, rl: readline.Interface): Promise<DispatchResult> {
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
    return await handler(parsed.args, rl);
  } catch (err: any) {
    failure(`Command failed: ${err.message ?? err}`);
    return "continue";
  }
}
