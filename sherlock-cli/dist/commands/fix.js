import { Command } from "commander";
import fs from "fs";
import { useMock } from "../services/client.js";
import { getIncidentState } from "../services/api.js";
import { mockIncidentState } from "../services/mock.js";
import { config } from "../config.js";
import { initSession } from "../shell/session.js";
import { viewFix } from "../shell/views.js";
import { failure, info, success, warn } from "../shell/render.js";
export const fixCommand = new Command("fix")
    .description("Fetch generated fix for an incident")
    .argument("<incident-id>", "Incident ID")
    .option("--output <file>", "Save patch to file")
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
        const state = mock ? mockIncidentState(incidentId) : await getIncidentState(incidentId);
        viewFix(incidentId, state);
        if (opts.output && state.fix?.patch_unified_diff) {
            fs.writeFileSync(opts.output, state.fix.patch_unified_diff);
            success(`Patch saved to ${opts.output}`);
        }
    }
    catch (err) {
        failure(err.message ?? "Failed to fetch fix");
    }
});
