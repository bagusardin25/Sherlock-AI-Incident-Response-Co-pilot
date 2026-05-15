import readline from "readline";
import chalk from "chalk";

import { initSession, getSession, modeLabel } from "./session.js";
import { dispatchCommand } from "./commands.js";
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
    : chalk.yellow("no — run /auth login");
  console.log(chalk.dim(modeLabel(sess.mode)));
  console.log(chalk.dim("Workspace      ") + chalk.white(sess.workspace));
  console.log(chalk.dim("Authenticated  ") + authStr);
  blank();
  info(`Type ${chalk.cyan("/help")} for available commands`);
  blank();
}

function buildPrompt(): string {
  const sess = getSession();
  if (sess.activeIncident) {
    return `${chalk.cyan("sherlock")}${chalk.dim("(")}${chalk.yellow(sess.activeIncident)}${chalk.dim(")")} ${chalk.cyan("›")} `;
  }
  return `${chalk.cyan("sherlock")} ${chalk.cyan("›")} `;
}

export async function runShell(): Promise<void> {
  await initSession();

  console.log(SHELL_BANNER);
  renderSessionHeader();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: buildPrompt(),
    terminal: process.stdout.isTTY,
  });

  rl.setPrompt(buildPrompt());
  rl.prompt();

  return new Promise<void>((resolve) => {
    // Serialize async dispatch: a long-running /resolve must finish before
    // the next slash command (e.g. /exit) is processed.
    let pending: Promise<void> = Promise.resolve();
    let exiting = false;

    rl.on("line", (line) => {
      pending = pending.then(async () => {
        if (exiting) return;
        const result = await dispatchCommand(line, rl);
        if (result === "exit") {
          exiting = true;
          rl.close();
          return;
        }
        rl.setPrompt(buildPrompt());
        rl.prompt();
      });
    });

    rl.on("close", () => {
      // Wait for any in-flight handler to drain so we don't cut off output.
      pending.finally(() => {
        if (process.stdout.isTTY) console.log("");
        resolve();
      });
    });

    rl.on("SIGINT", () => {
      // Ctrl+C: clear current line, show hint, keep shell alive.
      if (process.stdout.isTTY) {
        process.stdout.write("\n");
        info(`Press ${chalk.cyan("Ctrl+D")} or type ${chalk.cyan("/exit")} to leave.`);
      }
      rl.setPrompt(buildPrompt());
      rl.prompt();
    });
  });
}
