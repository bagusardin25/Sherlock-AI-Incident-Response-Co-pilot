import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import { useMock } from "../services/client.js";
import { getPostmortem, getIncidentState } from "../services/api.js";
import { mockPostmortem } from "../services/mock.js";
import { log } from "../utils/logger.js";

export const postmortemCommand = new Command("postmortem")
  .description("Fetch or generate postmortem report for an incident")
  .argument("<incident-id>", "Incident ID")
  .option("--output <file>", "Save postmortem to file")
  .action(async (incidentId: string, opts: { output?: string }) => {
    const mock = await useMock();
    if (mock) log.info("Using mock mode");

    const spinner = ora("Fetching postmortem...").start();

    try {
      let postmortemText: string;

      if (mock) {
        postmortemText = mockPostmortem(incidentId);
      } else {
        try {
          const res = await getPostmortem(incidentId);
          postmortemText = res.postmortem;
        } catch {
          // Fallback: try getting from state
          const state = await getIncidentState(incidentId);
          postmortemText = state.postmortem || "";
        }
      }

      spinner.stop();

      if (!postmortemText) {
        log.warn("No postmortem generated yet for this incident");
        log.info("Run 'sherlock investigate' first to generate a postmortem");
        return;
      }

      log.section("📝 POSTMORTEM", chalk.magenta);
      console.log();
      // Render markdown with basic formatting
      for (const line of postmortemText.split("\n")) {
        if (line.startsWith("# ")) console.log(chalk.bold.white(`  ${line.slice(2)}`));
        else if (line.startsWith("## ")) console.log(chalk.bold.cyan(`\n  ${line.slice(3)}`));
        else if (line.startsWith("- [")) console.log(chalk.yellow(`  ${line}`));
        else console.log(chalk.dim(`  ${line}`));
      }

      if (opts.output) {
        fs.writeFileSync(opts.output, postmortemText);
        log.success(`\n  Postmortem saved to ${opts.output}`);
      }
    } catch (err: any) {
      spinner.fail(err.message || "Failed to fetch postmortem");
    }
  });
