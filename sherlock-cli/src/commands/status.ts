import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { useMock } from "../services/client.js";
import { listIncidents, getIncidentState } from "../services/api.js";
import { mockIncidentList, mockIncidentState } from "../services/mock.js";
import { log } from "../utils/logger.js";

export const statusCommand = new Command("status")
  .description("List incidents or show detail for a specific incident")
  .argument("[incident-id]", "Optional incident ID for detail view")
  .action(async (incidentId?: string) => {
    const mock = await useMock();
    if (mock) log.info("Using mock mode");

    const spinner = ora("Fetching incidents...").start();

    try {
      if (incidentId) {
        // Detail view
        const state = mock ? mockIncidentState(incidentId) : await getIncidentState(incidentId);
        spinner.stop();
        renderDetail(state);
      } else {
        // List view
        const incidents = mock ? mockIncidentList() : await listIncidents();
        spinner.stop();
        renderList(incidents);
      }
    } catch (err: any) {
      spinner.fail(err.message || "Failed to fetch incidents");
    }
  });

function renderList(incidents: any[]) {
  if (!incidents.length) {
    log.info("No incidents found");
    return;
  }

  console.log(chalk.bold(`\n  Incidents (${incidents.length}):\n`));
  console.log(chalk.dim("  ID               │ Severity │ Service            │ Status"));
  console.log(chalk.dim("  ─────────────────┼──────────┼────────────────────┼──────────"));

  for (const inc of incidents) {
    const sev = log.severity(inc.triage?.severity || "unknown");
    const status = inc.status === "completed" ? chalk.green(inc.status) : chalk.yellow(inc.status);
    console.log(`  ${inc.incident_id} │ ${sev.padEnd(18)} │ ${(inc.triage?.service || "—").padEnd(18)} │ ${status}`);
  }
  console.log();
}

function renderDetail(state: any) {
  console.log(chalk.bold(`\n  Incident: ${state.incident_id}`));
  console.log(chalk.dim(`  Status: `) + (state.status === "completed" ? chalk.green(state.status) : chalk.yellow(state.status)));

  if (state.triage) {
    log.section("TRIAGE", chalk.red);
    log.kv("Severity", log.severity(state.triage.severity));
    log.kv("Service", state.triage.service);
    log.kv("Error Type", state.triage.error_type);
  }

  if (state.root_cause) {
    log.section("ROOT CAUSE", chalk.blue);
    log.kv("Analysis", state.root_cause.root_cause);
    log.kv("Confidence", `${(state.root_cause.confidence * 100).toFixed(0)}%`);
  }

  if (state.fix) {
    log.section("FIX", chalk.green);
    log.kv("PR Title", state.fix.pr_title);
    log.kv("Files", (state.fix.files_modified || []).join(", "));
  }

  console.log(chalk.dim(`\n  Use 'sherlock fix ${state.incident_id}' for full patch`));
  console.log(chalk.dim(`  Use 'sherlock postmortem ${state.incident_id}' for report\n`));
}
