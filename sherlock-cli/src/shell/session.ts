import { readConfig } from "../commands/auth.js";
import { isMockMode } from "../config.js";
import { healthCheck } from "../services/api.js";

export type ConnectionMode = "cloud" | "local" | "mock" | "offline";

export interface HistoryEntry {
  incidentId: string;
  severity?: string;
  service?: string;
  summary?: string;
  timestamp: string;
}

export interface SessionState {
  workspace: string;
  authenticated: boolean;
  apiUrl: string;
  apiKey: string;
  mode: ConnectionMode;
  activeIncident: string | null;
  history: HistoryEntry[];
  startedAt: Date;
}

function classifyMode(apiUrl: string, authenticated: boolean, backendOk: boolean): ConnectionMode {
  if (isMockMode()) return "mock";
  if (!backendOk) return "offline";
  const isLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(apiUrl);
  if (isLocal) return "local";
  return authenticated ? "cloud" : "offline";
}

let _session: SessionState | null = null;

export async function initSession(): Promise<SessionState> {
  const cfg = readConfig();
  const apiUrl = cfg.apiUrl ?? "http://localhost:8000";
  const apiKey = cfg.apiKey ?? "";
  const authenticated = Boolean(apiKey);

  // Probe backend reachability without crashing the shell on failure.
  let backendOk = false;
  if (!isMockMode()) {
    try {
      backendOk = await healthCheck();
    } catch {
      backendOk = false;
    }
  }

  _session = {
    workspace: process.env.SHERLOCK_WORKSPACE || "production",
    authenticated,
    apiUrl,
    apiKey,
    mode: classifyMode(apiUrl, authenticated, backendOk),
    activeIncident: null,
    history: [],
    startedAt: new Date(),
  };
  return _session;
}

export function getSession(): SessionState {
  if (!_session) {
    throw new Error("Session not initialized — call initSession() first");
  }
  return _session;
}

export function setActiveIncident(id: string | null) {
  if (!_session) return;
  _session.activeIncident = id;
}

export function recordIncident(entry: HistoryEntry) {
  if (!_session) return;
  // Avoid duplicates: replace if same id, else prepend.
  _session.history = [entry, ..._session.history.filter((h) => h.incidentId !== entry.incidentId)];
  if (_session.history.length > 50) _session.history.length = 50;
}

export async function refreshAuth(): Promise<SessionState> {
  // Re-read on-disk config (e.g. after `/auth login`) and re-classify mode.
  const cfg = readConfig();
  if (!_session) return initSession();

  _session.apiUrl = cfg.apiUrl ?? _session.apiUrl;
  _session.apiKey = cfg.apiKey ?? "";
  _session.authenticated = Boolean(_session.apiKey);

  let backendOk = false;
  if (!isMockMode()) {
    try {
      backendOk = await healthCheck();
    } catch {
      backendOk = false;
    }
  }
  _session.mode = classifyMode(_session.apiUrl, _session.authenticated, backendOk);
  return _session;
}

// ─── display helpers ──────────────────────────────────────────────────────────

export function modeLabel(mode: ConnectionMode): string {
  switch (mode) {
    case "cloud":
      return "Connected to Sherlock Cloud";
    case "local":
      return "Connected to local backend";
    case "mock":
      return "Mock mode (local simulation)";
    case "offline":
      return "Backend unreachable — mock fallback available";
  }
}
