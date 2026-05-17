import chalk from "chalk";

const ANSI_RE = /\x1B\[[0-?]*[ -/]*[@-~]/g;

function visibleLength(value: string): number {
  return value.replace(ANSI_RE, "").length;
}

function terminalWidth(fallback = 88): number {
  const cols = process.stdout.columns;
  if (!cols || cols < 40) return fallback;
  return Math.min(cols, 120);
}

export function wrapText(text: string, options: { indent?: string; width?: number } = {}): string[] {
  const indent = options.indent ?? "";
  const width = Math.max(24, options.width ?? terminalWidth() - visibleLength(indent));
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (visibleLength(`${current} ${word}`) > width) {
      lines.push(indent + current);
      current = word;
    } else {
      current += " " + word;
    }
  }

  if (current) lines.push(indent + current);
  return lines.length ? lines : [indent];
}

// ─── agent name normalization ─────────────────────────────────────────────────

/**
 * Map any agent identifier (snake_case, with prefixes) to a clean display name.
 */
export function agentDisplayName(rawName: string): string {
  const map: Record<string, string> = {
    triage: "TRIAGE",
    forensics: "FORENSICS",
    bob_analyst: "ANALYST",
    analyst: "ANALYST",
    fix: "FIX",
    postmortem: "POSTMORTEM",
    pipeline: "PIPELINE",
  };
  return map[rawName] ?? rawName.replace(/_/g, " ").toUpperCase();
}

export function agentTag(rawName: string): string {
  return chalk.cyan.bold(`[${agentDisplayName(rawName)}]`);
}

// ─── single-line outputs ──────────────────────────────────────────────────────

export function agentLine(rawName: string, message: string) {
  console.log(`${agentTag(rawName)} ${chalk.white(message)}`);
}

export function agentRunning(rawName: string, message: string) {
  console.log(`${agentTag(rawName)} ${chalk.dim(message + "…")}`);
}

export function success(msg: string) {
  console.log(chalk.green("✓ ") + chalk.white(msg));
}

export function failure(msg: string) {
  console.log(chalk.red("✗ ") + chalk.white(msg));
}

export function info(msg: string) {
  console.log(chalk.dim(msg));
}

export function warn(msg: string) {
  console.log(chalk.yellow("⚠ ") + chalk.white(msg));
}

export function blank() {
  console.log("");
}

export function rule(width = 56) {
  console.log(chalk.dim("─".repeat(width)));
}

// ─── reasoning blocks ─────────────────────────────────────────────────────────

interface ReasoningBlock {
  hypothesis?: string;
  evidence?: string[];
  confidence?: number;
  summary?: string;
  detail?: Array<{ key: string; value: string }>;
}

function indentParagraph(text: string, indent: string): string[] {
  return wrapText(text, { indent, width: terminalWidth() - visibleLength(indent) });
}

function colorConfidence(pct: number): string {
  const s = `${pct}%`;
  if (pct >= 80) return chalk.green.bold(s);
  if (pct >= 50) return chalk.yellow.bold(s);
  return chalk.red.bold(s);
}

/**
 * Render a completed agent block: header line + structured reasoning beneath it.
 * Layout matches the spec:
 *
 *   [ANALYST] Root cause identified
 *
 *     Hypothesis:
 *       Race condition introduced during async checkout refactor.
 *
 *     Evidence:
 *       • stack trace correlation
 *       • commit timeline analysis
 *
 *     Confidence: 92%
 */
export function agentBlock(rawName: string, headline: string, block: ReasoningBlock) {
  blank();
  console.log(`${agentTag(rawName)} ${chalk.white(headline)}`);

  const innerIndent = "    ";
  const labelIndent = "  ";

  if (block.summary) {
    blank();
    for (const line of indentParagraph(block.summary, innerIndent)) {
      console.log(chalk.white(line));
    }
  }

  if (block.hypothesis) {
    blank();
    console.log(labelIndent + chalk.bold.white("Hypothesis:"));
    for (const line of indentParagraph(block.hypothesis, innerIndent)) {
      console.log(chalk.white(line));
    }
  }

  if (block.evidence && block.evidence.length) {
    blank();
    console.log(labelIndent + chalk.bold.white("Evidence:"));
    for (const item of block.evidence) {
      console.log(innerIndent + chalk.dim("• ") + chalk.white(item));
    }
  }

  if (block.detail && block.detail.length) {
    blank();
    for (const { key, value } of block.detail) {
      const keyLabel = labelIndent + chalk.dim(key.padEnd(14));
      const wrapped = wrapText(value, { width: terminalWidth() - visibleLength(keyLabel) });
      console.log(keyLabel + chalk.white(wrapped[0]));
      for (const extra of wrapped.slice(1)) {
        console.log(" ".repeat(visibleLength(keyLabel)) + chalk.white(extra));
      }
    }
  }

  if (typeof block.confidence === "number") {
    blank();
    console.log(labelIndent + chalk.bold.white("Confidence: ") + colorConfidence(Math.round(block.confidence * 100)));
  }
}

// ─── unified diff ─────────────────────────────────────────────────────────────

export function diff(patch: string, indent = "    ") {
  for (const line of patch.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) {
      console.log(indent + chalk.dim(line));
    } else if (line.startsWith("+")) {
      console.log(indent + chalk.green(line));
    } else if (line.startsWith("-")) {
      console.log(indent + chalk.red(line));
    } else if (line.startsWith("@@")) {
      console.log(indent + chalk.cyan(line));
    } else {
      console.log(indent + chalk.dim(line));
    }
  }
}

// ─── severity badge ───────────────────────────────────────────────────────────

export function severityBadge(level: string): string {
  const s = (level || "unknown").toLowerCase();
  switch (s) {
    case "critical":
      return chalk.bgRed.white.bold(" CRITICAL ");
    case "high":
      return chalk.red.bold("HIGH");
    case "medium":
      return chalk.yellow.bold("MEDIUM");
    case "low":
      return chalk.green.bold("LOW");
    default:
      return chalk.dim(s.toUpperCase());
  }
}

// ─── section header ───────────────────────────────────────────────────────────

export function sectionHeader(title: string) {
  blank();
  console.log(chalk.bold.white(title));
  rule(title.length);
}

// ─── key-value list ───────────────────────────────────────────────────────────

export function kv(key: string, value: string, indent = "  ") {
  const keyLabel = indent + chalk.dim(key.padEnd(12));
  const wrapped = wrapText(value, { width: terminalWidth() - visibleLength(keyLabel) });
  console.log(keyLabel + wrapped[0]);
  for (const extra of wrapped.slice(1)) {
    console.log(" ".repeat(visibleLength(keyLabel)) + extra);
  }
}

// ─── reasoning helpers tied to known agent shapes ─────────────────────────────

export function renderTriage(headline: string, data: any) {
  agentBlock("triage", headline, {
    summary: data.summary,
    detail: [
      { key: "Severity", value: severityBadge(data.severity) },
      { key: "Service", value: chalk.white(data.service ?? "—") },
      { key: "Error type", value: chalk.white(data.error_type ?? "—") },
    ],
    confidence: data.confidence,
  });
}

export function renderForensics(headline: string, data: any) {
  const detail: Array<{ key: string; value: string }> = [];
  if (data.suspect_commit) {
    const c = data.suspect_commit;
    const commitLine = `${chalk.yellow(c.hash)} — ${chalk.white(c.message)}${c.author ? chalk.dim(" (" + c.author + ")") : ""}`;
    detail.push({ key: "Suspect commit", value: commitLine });
  }
  if (typeof data.commits_scanned === "number") {
    detail.push({ key: "Commits scanned", value: chalk.white(String(data.commits_scanned)) });
  }
  if (Array.isArray(data.suspect_files) && data.suspect_files.length) {
    detail.push({ key: "Suspect files", value: chalk.white(data.suspect_files.join(", ")) });
  }
  agentBlock("forensics", headline, {
    detail,
    evidence: data.evidence,
  });
}

export function renderAnalyst(headline: string, data: any) {
  agentBlock("analyst", headline, {
    hypothesis: data.hypothesis ?? data.root_cause,
    evidence: data.evidence,
    confidence: data.confidence,
  });
}

export function renderFix(headline: string, data: any) {
  const detail: Array<{ key: string; value: string }> = [];
  if (data.pr_title) detail.push({ key: "PR title", value: chalk.white(data.pr_title) });
  if (data.files_modified && data.files_modified.length) {
    detail.push({ key: "Files", value: chalk.white(data.files_modified.join(", ")) });
  }
  if (data.has_test) detail.push({ key: "Tests", value: chalk.green("regression test included") });

  agentBlock("fix", headline, { detail });

  if (data.patch) {
    blank();
    console.log("  " + chalk.dim("Patch:"));
    diff(data.patch, "    ");
  }
}

export function renderPostmortem(headline: string, data: any) {
  const detail: Array<{ key: string; value: string }> = [];
  if (typeof data.length === "number") {
    detail.push({ key: "Length", value: chalk.white(`${data.length} chars`) });
  }
  if (typeof data.sections === "number") {
    detail.push({ key: "Sections", value: chalk.white(String(data.sections)) });
  }
  agentBlock("postmortem", headline, { detail });
}

/** Dispatch a completed event to the right renderer. */
export function renderCompletedEvent(rawName: string, headline: string, data: any) {
  switch (rawName) {
    case "triage":
      return renderTriage(headline, data);
    case "forensics":
      return renderForensics(headline, data);
    case "analyst":
    case "bob_analyst":
      return renderAnalyst(headline, data);
    case "fix":
      return renderFix(headline, data);
    case "postmortem":
      return renderPostmortem(headline, data);
    default:
      agentLine(rawName, headline);
  }
}
