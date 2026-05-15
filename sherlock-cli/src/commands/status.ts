import { Command } from "commander";

import { useMock } from "../services/client.js";
import { listIncidents, getIncidentState } from "../services/api.js";
import { mockIncidentList, mockIncidentState } from "../services/mock.js";
import { config } from "../config.js";
import { initSession } from "../shell/session.js";
import { viewIncidentList, viewIncidentDetail } from "../shell/views.js";
import { failure, info, warn } from "../shell/render.js";

export const statusCommand = new Command("status")
  .description("List incidents or show detail for a specific incident")
  .argument("[incident-id]", "Optional incident ID for detail view")
  .action(async (incidentId?: string) => {
    await initSession();
    const mock = await useMock();
    if (mock) info("Using mock mode");
    if (!mock && !config.apiKey) {
      warn("Not authenticated. Run: sherlock auth login");
      return;
    }

    try {
      if (incidentId) {
        const state = mock ? mockIncidentState(incidentId) : await getIncidentState(incidentId);
        viewIncidentDetail(state);
      } else {
        const incidents = mock ? mockIncidentList() : await listIncidents();
        viewIncidentList(incidents);
      }
    } catch (err: any) {
      failure(err.message ?? "Failed to fetch incidents");
    }
  });
