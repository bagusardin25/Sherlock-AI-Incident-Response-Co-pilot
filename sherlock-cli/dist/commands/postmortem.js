import { Command } from "commander";
import fs from "fs";
import { useMock } from "../services/client.js";
import { getIncidentState, getPostmortem } from "../services/api.js";
import { mockPostmortem } from "../services/mock.js";
import { config } from "../config.js";
import { initSession } from "../shell/session.js";
import { viewPostmortem } from "../shell/views.js";
import { failure, info, success, warn } from "../shell/render.js";
export const postmortemCommand = new Command("postmortem")
    .description("Fetch postmortem report for an incident")
    .argument("<incident-id>", "Incident ID")
    .option("--output <file>", "Save postmortem to file")
    .action(async (incidentId, opts) => {
    await initSession();
    const mock = await useMock();
    if (mock)
        info("Using mock mode");
    if (!mock && !config.apiKey) {
        warn("Not authenticated. Run: sherlock auth login");
        return;
    }
    try {
        let text = "";
        if (mock) {
            text = mockPostmortem(incidentId);
        }
        else {
            try {
                const r = await getPostmortem(incidentId);
                text = r.postmortem;
            }
            catch {
                const state = await getIncidentState(incidentId);
                text = state.postmortem ?? "";
            }
        }
        viewPostmortem(incidentId, text);
        if (opts.output && text) {
            fs.writeFileSync(opts.output, text);
            success(`Postmortem saved to ${opts.output}`);
        }
    }
    catch (err) {
        failure(err.message ?? "Failed to fetch postmortem");
    }
});
