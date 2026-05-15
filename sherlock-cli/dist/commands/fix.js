import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import { useMock } from "../services/client.js";
import { getIncidentState } from "../services/api.js";
import { mockIncidentState } from "../services/mock.js";
import { log } from "../utils/logger.js";
export const fixCommand = new Command("fix")
    .description("Fetch or trigger fix generation for an incident")
    .argument("<incident-id>", "Incident ID")
    .option("--output <file>", "Save patch to file")
    .action(async (incidentId, opts) => {
    const mock = await useMock();
    if (mock)
        log.info("Using mock mode");
    const spinner = ora("Fetching fix details...").start();
    try {
        const state = mock ? mockIncidentState(incidentId) : await getIncidentState(incidentId);
        spinner.stop();
        if (!state.fix) {
            log.warn("No fix generated yet for this incident");
            log.info("Run 'sherlock investigate' first to generate a fix");
            return;
        }
        const fix = state.fix;
        log.section("🛠️  FIX PROPOSAL", chalk.green);
        log.kv("PR Title", chalk.cyan.bold(fix.pr_title));
        log.kv("Files Modified", (fix.files_modified || []).join(", "));
        if (fix.patch_unified_diff) {
            console.log(chalk.bold("\n  Patch:"));
            log.diff(fix.patch_unified_diff);
        }
        if (fix.test_code) {
            console.log(chalk.bold("\n  Test Code:"));
            console.log(chalk.dim(`  ${fix.test_code}`));
        }
        if (opts.output) {
            fs.writeFileSync(opts.output, fix.patch_unified_diff || "");
            log.success(`Patch saved to ${opts.output}`);
        }
        console.log(chalk.dim(`\n  Apply: git apply ${opts.output || "<patch-file>"}`));
    }
    catch (err) {
        spinner.fail(err.message || "Failed to fetch fix");
    }
});
