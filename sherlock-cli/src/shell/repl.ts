import readline from "readline";
import chalk from "chalk";
import { select, search, input, password } from "@inquirer/prompts";

import { initSession, getSession, modeLabel } from "./session.js";
import { dispatchCommand, type AskFn } from "./commands.js";
import { blank, info } from "./render.js";

const SHELL_BANNER = `
${chalk.cyan.bold("╔════════════════════════════════════════════════════════╗")}
${chalk.cyan.bold("║")}  ${chalk.white.bold("Sherlock Incident Response Shell")}                      ${chalk.cyan.bold("║")}
${chalk.cyan.bold("║")}  ${chalk.dim("Powered by IBM Bob repository intelligence")}            ${chalk.cyan.bold("║")}
${chalk.cyan.bold("╚════════════════════════════════════════════════════════╝")}
`;

function renderSessionHeader() {
  const sess = getSession();
  const authStr = sess.authenticated
    ? chalk.green("yes")
    : chalk.yellow("no — select /auth login");
  console.log(chalk.dim(modeLabel(sess.mode, sess.autoFallbackMock)));
  console.log(chalk.dim("Workspace      ") + chalk.white(sess.workspace));
  console.log(chalk.dim("Authenticated  ") + authStr);
  if (!sess.authenticated) {
    console.log(chalk.dim("Next           ") + chalk.white("Run /auth login to open web login and create an API key"));
  }
  blank();
  info(`Type ${chalk.cyan("/")} for command palette`);
  blank();
}

function buildPromptLabel(): string {
  const sess = getSession();
  if (sess.activeIncident) {
    return `sherlock(${sess.activeIncident}) ›`;
  }
  return "sherlock ›";
}

// ─── Command palette choices ─────────────────────────────────────────────────

const PALETTE_CHOICES = [
  { name: "/resolve        Resolve a production incident", value: "resolve" },
  { name: "/status         List incidents or show detail", value: "status" },
  { name: "/fix            Show generated fix", value: "fix" },
  { name: "/postmortem     Show incident report", value: "postmortem" },
  { name: "/open           Open in web dashboard", value: "open" },
  { name: "/history        Session history", value: "history" },
  { name: "/agents         Show multi-agent pipeline", value: "agents" },
  { name: "/auth login     Authenticate CLI", value: "auth login" },
  { name: "/auth status    Auth status", value: "auth status" },
  { name: "/auth logout    Remove credentials", value: "auth logout" },
  { name: "/clear          Clear screen", value: "clear" },
  { name: "/help           Show help", value: "help" },
  { name: "/exit           Leave the shell", value: "exit" },
];

// ─── Ask function for sub-prompts ────────────────────────────────────────────

const ask: AskFn = async (question, opts) => {
  try {
    if (opts?.mask) {
      return await password({ message: question, mask: "•" });
    }
    return await input({ message: question });
  } catch {
    return "";
  }
};

// ─── Main REPL loop ──────────────────────────────────────────────────────────

export async function runShell(): Promise<void> {
  if (!process.stdout.isTTY) {
    console.error(
      chalk.yellow(
        "Sherlock shell requires an interactive terminal.\n" +
          "Use one-shot mode for scripts and CI: sherlock <command>",
      ),
    );
    process.exit(1);
  }

  await initSession();

  console.log(SHELL_BANNER);
  renderSessionHeader();

  while (true) {
    // Wait for user to press a key. If it's "/", show the palette dropdown.
    // Otherwise collect a full line for direct command input.
    const line = await waitForInput();

    if (line === null) {
      // EOF / Ctrl+C
      blank();
      info("Session closed.");
      blank();
      return;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    const result = await dispatchCommand(trimmed, ask);
    if (result === "exit") return;
  }
}

// ─── Input handler: detects "/" and pops palette, otherwise reads a line ──────

function waitForInput(): Promise<string | null> {
  return new Promise((resolve) => {
    const prompt = buildPromptLabel();
    process.stdout.write(chalk.cyan(prompt) + " ");
    waitForKey(prompt, resolve);
  });
}

function waitForKey(prompt: string, resolve: (val: string | null) => void) {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.once("data", (buf) => {
    const ch = buf.toString();

    // Ctrl+C or Ctrl+D
    if (ch === "\x03" || ch === "\x04") {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve(null);
      return;
    }

    // Backspace / Delete / Escape / arrow keys — swallow silently, keep waiting
    if (
      ch === "\x7f" || ch === "\x08" ||
      ch === "\x1b[3~" || ch === "\x1b" ||
      ch.startsWith("\x1b[")
    ) {
      // Multi-byte escape sequences are delivered in a single buffer,
      // so there is nothing extra to drain. Just keep waiting.
      waitForKey(prompt, resolve);
      return;
    }

    // Enter / newline with nothing typed — just keep waiting
    if (ch === "\r" || ch === "\n" || ch === "\r\n") {
      waitForKey(prompt, resolve);
      return;
    }

    // "/" → enter command search mode: collect more chars to filter, then show palette
    if (ch === "/") {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
      // Clear the prompt line so the palette renders cleanly
      process.stdout.write("\r" + " ".repeat(prompt.length + 2) + "\r");
      collectAndShowPalette("").then((choice) => {
        if (!choice) {
          resolve("");
        } else {
          resolve(`/${choice}`);
        }
      });
      return;
    }

    // Any other character → switch to readline for full line input
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.stdin.pause();

    const firstChar = ch.replace(/[\r\n]/g, "");
    if (!firstChar) {
      waitForKey(prompt, resolve);
      return;
    }

    // Use readline to collect the rest of the line
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: "",
    });

    // Write the first char so user sees it
    process.stdout.write(firstChar);
    rl.question("", (rest) => {
      rl.close();
      resolve(firstChar + rest);
    });
  });
}

async function collectAndShowPalette(initialFilter: string): Promise<string | null> {
  try {
    const choice = await search<string>({
      message: buildPromptLabel(),
      source: (term) => {
        const filter = (term ?? initialFilter).toLowerCase();
        if (!filter) return PALETTE_CHOICES;
        return PALETTE_CHOICES.filter(
          (c) => c.name.toLowerCase().includes(filter) || c.value.toLowerCase().includes(filter),
        );
      },
    });
    return choice;
  } catch {
    return null;
  }
}

async function showPalette(): Promise<string | null> {
  return collectAndShowPalette("");
}
