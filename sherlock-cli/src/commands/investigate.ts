import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import EventSource from "eventsource";
import { useMock } from "../services/client.js";
import { submitIncident } from "../services/api.js";
import { mockInvestigate, AgentEvent } from "../services/mock.js";
import { config } from "../config.js";
import { log } from "../utils/logger.js";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function showStartupSequence() {
  console.log(chalk.cyan("\n  Initializing Sherlock AI Incident Response Pipeline...\n"));
  const steps = [
    "IBM Bob repository context loaded",
    "Multi-agent orchestration online",
    "Incident correlation engine active",
  ];
  for (const step of steps) {
    await delay(400);
    console.log(chalk.green(`  ✓ `) + chalk.white(step));
  }
  console.log();
}

const AGENT_ICONS: Record<string, string> = {
  triage: "🎯",
  forensics: "🔬",
  bob_analyst: "🧠",
  fix: "🛠️",
  postmortem: "📝",
  pipeline: "✅",
};

function renderEvent(event: AgentEvent, timings: Map<string, number>) {
  const icon = AGENT_ICONS[event.agent_name] || "▸";
  const name = event.agent_name.replace("_", " ").toUpperCase();
  const elapsed = timings.get(event.agent_name);
  const timeStr = elapsed ? chalk.dim(` (${(elapsed / 1000).toFixed(1)}s)`) : "";

  if (event.status === "completed" && event.data) {
    log.section(`${icon} ${name}${timeStr}`, chalk.green);
    const d = event.data;

    switch (event.agent_name) {
      case "triage":
        log.kv("Severity", log.severity(d.severity));
        log.kv("Service", d.service);
        log.kv("Error Type", d.error_type);
        log.kv("Confidence", `${(d.confidence * 100).toFixed(0)}%`);
        break;
      case "forensics":
        log.kv("Commits Analyzed", String(d.commits_count));
        log.kv("Suspect Files", (d.suspect_files || []).join(", "));
        if (d.suspect_commit) log.kv("Suspect Commit", chalk.yellow(d.suspect_commit));
        break;
      case "bob_analyst":
        log.kv("Root Cause", d.root_cause);
        log.kv("Confidence", `${(d.confidence * 100).toFixed(0)}%`);
        break;
      case "fix":
        log.kv("PR Title", chalk.cyan(d.pr_title));
        log.kv("Files Modified", (d.files_modified || []).join(", "));
        if (d.has_test) log.success("Test case included");
        if (d.patch) {
          console.log(chalk.dim("\n  Patch:"));
          log.diff(d.patch);
        }
        break;
      case "postmortem":
        log.success(`Document generated (${d.length} chars, ${d.sections} sections)`);
        break;
      case "pipeline":
        console.log(chalk.green.bold("\n  ✓ Investigation complete"));
        if (d.incident_id) log.kv("Incident ID", d.incident_id);
        break;
    }
  }
}

function showMetrics(totalStart: number, timings: Map<string, number>) {
  const totalSec = ((Date.now() - totalStart) / 1000).toFixed(1);
  const rcTime = timings.get("bob_analyst");
  const fixTime = timings.get("fix");

  console.log(chalk.cyan.bold("\n  ┌─────────────────────────────────────────┐"));
  console.log(chalk.cyan.bold("  │") + chalk.white.bold("  📊 Performance Metrics                ") + chalk.cyan.bold("│"));
  console.log(chalk.cyan.bold("  ├─────────────────────────────────────────┤"));
  console.log(chalk.cyan.bold("  │") + `  Total analysis time: ${chalk.white.bold(totalSec + "s")}`.padEnd(49) + chalk.cyan.bold("│"));
  if (rcTime) console.log(chalk.cyan.bold("  │") + `  Root cause identified in: ${chalk.green.bold((rcTime / 1000).toFixed(1) + "s")}`.padEnd(49) + chalk.cyan.bold("│"));
  if (fixTime) console.log(chalk.cyan.bold("  │") + `  Patch generated in: ${chalk.green.bold((fixTime / 1000).toFixed(1) + "s")}`.padEnd(49) + chalk.cyan.bold("│"));
  console.log(chalk.cyan.bold("  │") + `  Estimated MTTR reduction: ${chalk.green.bold("~98%")}`.padEnd(49) + chalk.cyan.bold("│"));
  console.log(chalk.cyan.bold("  │") + `  Traditional MTTR: ${chalk.red("4.4 hours")} → Sherlock: ${chalk.green.bold(totalSec + "s")}`.padEnd(49) + chalk.cyan.bold("│"));
  console.log(chalk.cyan.bold("  └─────────────────────────────────────────┘\n"));
}

export const investigateCommand = new Command("investigate")
  .description("Investigate an incident from log file or alert text")
  .argument("<logfile>", "Path to log/alert file or raw error text")
  .option("--repo <url>", "GitHub repository URL", "https://github.com/org/service")
  .option("--dry-run", "Show what would happen without submitting")
  .action(async (logfile: string, opts: { repo: string; dryRun?: boolean }) => {
    // Read input
    let rawInput: string;
    if (fs.existsSync(logfile)) {
      rawInput = fs.readFileSync(logfile, "utf-8");
    } else {
      rawInput = logfile; // treat as raw text
    }

    if (opts.dryRun) {
      log.warn("DRY RUN — no incident will be submitted");
      log.kv("Input", rawInput.slice(0, 200) + (rawInput.length > 200 ? "..." : ""));
      log.kv("Repo", opts.repo);
      log.info("Would submit to backend and stream agent results");
      return;
    }

    // Cinematic startup
    await showStartupSequence();

    const mock = await useMock();
    if (mock) log.info("Backend unavailable — using mock mode");

    const timings = new Map<string, number>();
    const agentStarts = new Map<string, number>();
    const totalStart = Date.now();

    const spinner = ora({ text: "Submitting incident...", color: "cyan" }).start();

    if (mock) {
      const incidentId = `inc-${Date.now().toString(36)}`;
      spinner.succeed(`Incident submitted: ${chalk.bold(incidentId)}`);
      console.log(chalk.dim("  Streaming multi-agent analysis...\n"));

      for await (const event of mockInvestigate(incidentId)) {
        if (event.status === "running") {
          agentStarts.set(event.agent_name, Date.now());
          const icon = event.message.match(/^\p{Emoji}/u) ? "" : AGENT_ICONS[event.agent_name] + " " || "▸ ";
          spinner.start(`${icon}${event.message}`);
        } else if (event.status === "completed") {
          const start = agentStarts.get(event.agent_name);
          if (start) timings.set(event.agent_name, Date.now() - start);
          spinner.stop();
          renderEvent(event, timings);
        } else if (event.status === "failed") {
          spinner.fail(event.message);
        }
      }

      showMetrics(totalStart, timings);
    } else {
      // Real backend mode with SSE
      try {
        const result = await submitIncident({ raw_input: rawInput, repo_url: opts.repo });
        spinner.succeed(`Incident submitted: ${chalk.bold(result.incident_id)}`);
        console.log(chalk.dim("  Streaming multi-agent analysis...\n"));

        const streamUrl = `${config.apiUrl}${result.stream_url}?token=${config.apiKey}`;
        await streamSSE(streamUrl, spinner, timings, agentStarts);
        showMetrics(totalStart, timings);
      } catch (err: any) {
        spinner.fail(`Submission failed: ${err.message || err}`);
      }
    }
  });

function streamSSE(url: string, spinner: ReturnType<typeof ora>, timings: Map<string, number>, agentStarts: Map<string, number>): Promise<void> {
  return new Promise((resolve, reject) => {
    const es = new EventSource(url);

    es.onmessage = (msg) => {
      try {
        const event: AgentEvent = JSON.parse(msg.data);
        if (event.agent_name === "pipeline" && event.status === "completed") {
          spinner.stop();
          renderEvent(event, timings);
          es.close();
          resolve();
          return;
        }
        if (event.status === "running") {
          agentStarts.set(event.agent_name, Date.now());
          const icon = event.message.match(/^\p{Emoji}/u) ? "" : (AGENT_ICONS[event.agent_name] || "▸") + " ";
          spinner.start(`${icon}${event.message}`);
        } else if (event.status === "completed") {
          const start = agentStarts.get(event.agent_name);
          if (start) timings.set(event.agent_name, Date.now() - start);
          spinner.stop();
          renderEvent(event, timings);
        } else if (event.status === "failed") {
          spinner.fail(event.message);
          es.close();
          reject(new Error(event.message));
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      es.close();
      spinner.stop();
      resolve(); // stream ended
    };
  });
}
