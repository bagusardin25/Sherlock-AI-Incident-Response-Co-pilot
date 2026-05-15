import chalk from "chalk";

import {
  agentTag,
  blank,
  failure,
  info,
  rule,
  severityBadge,
  warn,
  renderAnalyst,
  renderFix,
  renderTriage,
} from "./render.js";

/**
 * Shared view layer used by both the interactive shell and the one-shot
 * Commander commands. Keep all incident-display logic here so the CLI
 * looks identical regardless of how it was invoked.
 */

// ─── list view ────────────────────────────────────────────────────────────────

export function viewIncidentList(incidents: any[]) {
  blank();
  if (!incidents.length) {
    info("No incidents recorded.");
    blank();
    return;
  }
  console.log(chalk.bold.white(`  Incidents (${incidents.length})`));
  rule(40);
  for (const inc of incidents) {
    const sev = severityBadge(inc.triage?.severity ?? "unknown");
    const status =
      inc.status === "completed" ? chalk.green(inc.status) : chalk.yellow(inc.status);
    console.log(
      `  ${chalk.cyan(String(inc.incident_id).padEnd(16))}  ${sev.padEnd(20)}  ${(inc.triage?.service ?? "—").padEnd(20)}  ${status}`,
    );
  }
  blank();
}

// ─── detail view ──────────────────────────────────────────────────────────────

export function viewIncidentDetail(state: any) {
  blank();
  console.log(`${chalk.dim("Incident")} ${chalk.cyan(state.incident_id)}  ${chalk.dim("·")}  ${chalk.white(state.status ?? "unknown")}`);
  if (state.triage) renderTriage("Triage summary", state.triage);
  if (state.root_cause) renderAnalyst("Root cause analysis", state.root_cause);
  if (state.fix) {
    renderFix("Fix proposal", {
      pr_title: state.fix.pr_title,
      files_modified: state.fix.files_modified,
      patch: state.fix.patch_unified_diff,
      has_test: !!state.fix.test_code,
    });
  }
  blank();
  info(`Use /fix or /postmortem to drill in.`);
  blank();
}

// ─── fix view ─────────────────────────────────────────────────────────────────

export function viewFix(incidentId: string, state: any) {
  if (!state.fix) {
    warn(`No fix recorded for ${incidentId} yet.`);
    return;
  }
  blank();
  console.log(`${chalk.dim("Incident")} ${chalk.cyan(incidentId)}`);
  renderFix("Fix proposal", {
    pr_title: state.fix.pr_title,
    files_modified: state.fix.files_modified,
    patch: state.fix.patch_unified_diff,
    has_test: !!state.fix.test_code,
  });
  blank();
}

// ─── postmortem view ──────────────────────────────────────────────────────────

export function viewPostmortem(incidentId: string, text: string) {
  if (!text) {
    warn(`No postmortem available for ${incidentId}.`);
    return;
  }
  blank();
  console.log(`${agentTag("postmortem")} ${chalk.white("Incident report")} ${chalk.dim("·")} ${chalk.cyan(incidentId)}`);
  blank();
  for (const line of text.split("\n")) {
    if (line.startsWith("# ")) console.log(chalk.bold.white("  " + line.slice(2)));
    else if (line.startsWith("## ")) console.log("\n" + chalk.bold.cyan("  " + line.slice(3)));
    else if (line.startsWith("- [")) console.log(chalk.yellow("  " + line));
    else console.log(chalk.white("  " + line));
  }
  blank();
}

// ─── error helpers re-exported for convenience ───────────────────────────────

export { failure, warn };
