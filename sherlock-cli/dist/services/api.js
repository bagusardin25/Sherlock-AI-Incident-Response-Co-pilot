import axios from "axios";
import { config } from "../config.js";
export const api = axios.create({
    baseURL: config.apiUrl,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { "X-API-Key": config.apiKey }),
    },
});
export async function healthCheck() {
    try {
        const res = await api.get("/health", { timeout: 3000 });
        return res.data?.status === "healthy";
    }
    catch {
        return false;
    }
}
export async function submitIncident(payload) {
    const res = await api.post("/api/incidents/", payload);
    return res.data;
}
export async function getIncidentState(incidentId) {
    const res = await api.get(`/api/incidents/${incidentId}/state`);
    return res.data;
}
export async function listIncidents() {
    const res = await api.get("/api/incidents/");
    return res.data;
}
export async function getPostmortem(incidentId) {
    const res = await api.get(`/api/incidents/${incidentId}/postmortem`);
    return res.data;
}
