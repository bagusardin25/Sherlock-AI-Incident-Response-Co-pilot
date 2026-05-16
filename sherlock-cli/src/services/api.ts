import axios, { AxiosInstance } from "axios";
import { config } from "../config.js";

export const api: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  proxy: false,
  headers: {
    "Content-Type": "application/json",
    ...(config.apiKey && { "X-API-Key": config.apiKey }),
  },
});

function syncApiDefaults() {
  api.defaults.baseURL = config.apiUrl;
  if (config.apiKey) {
    api.defaults.headers.common["X-API-Key"] = config.apiKey;
  } else {
    delete api.defaults.headers.common["X-API-Key"];
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    syncApiDefaults();
    const res = await api.get("/health", { timeout: 3000 });
    return res.data?.status === "healthy";
  } catch {
    return false;
  }
}

export interface SubmitIncidentPayload {
  raw_input: string;
  repo_url: string;
  incident_id?: string;
}

export async function submitIncident(payload: SubmitIncidentPayload) {
  syncApiDefaults();
  const res = await api.post("/api/incidents/", payload);
  return res.data as { incident_id: string; stream_url: string };
}

export async function getIncidentState(incidentId: string) {
  syncApiDefaults();
  const res = await api.get(`/api/incidents/${incidentId}/state`);
  return res.data;
}

export async function listIncidents() {
  syncApiDefaults();
  const res = await api.get("/api/incidents/");
  return res.data as any[];
}

export async function getPostmortem(incidentId: string) {
  syncApiDefaults();
  const res = await api.get(`/api/incidents/${incidentId}/postmortem`);
  return res.data;
}
