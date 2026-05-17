#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";

import { investigateCommand } from "./commands/investigate.js";
import { statusCommand } from "./commands/status.js";
import { fixCommand } from "./commands/fix.js";
import { postmortemCommand } from "./commands/postmortem.js";
import { authCommand } from "./commands/auth.js";

import { runShell } from "./shell/repl.js";
import { checkForUpdate, currentVersion } from "./services/update.js";

const BANNER = `
${chalk.cyan.bold("╔═══════════════════════════════════════════════════════╗")}
${chalk.cyan.bold("║")}  ${chalk.white.bold("SHERLOCK")} ${chalk.dim("— AI Incident Response Co-pilot")}        ${chalk.cyan.bold("║")}
${chalk.cyan.bold("║")}  ${chalk.dim("Powered by IBM Bob repository intelligence")}         ${chalk.cyan.bold("║")}
${chalk.cyan.bold("╚═══════════════════════════════════════════════════════╝")}
`;

const HELP_TEXT = `${chalk.bold.white("  Sherlock CLI")}
  ${chalk.dim("Autonomous AI Incident Response")}

${chalk.bold.white("  Usage")}
    ${chalk.dim("$")} sherlock-cli              ${chalk.dim("# launch interactive shell")}
    ${chalk.dim("$")} sherlock-cli ${chalk.cyan("<command>")}    ${chalk.dim("# one-shot mode for scripting")}

${chalk.bold.white("  Interactive shell")}
    Run ${chalk.cyan("sherlock-cli")} with no arguments to enter the shell.
    Inside, use slash commands: ${chalk.cyan("/help")}, ${chalk.cyan("/resolve")}, ${chalk.cyan("/status")}, ${chalk.cyan("/fix")},
    ${chalk.cyan("/postmortem")}, ${chalk.cyan("/open")}, ${chalk.cyan("/history")}, ${chalk.cyan("/auth")}, ${chalk.cyan("/clear")}, ${chalk.cyan("/exit")}.

${chalk.bold.white("  One-shot Commands")}
    ${chalk.cyan("resolve")} ${chalk.dim("<file>")}         Resolve production incident
    ${chalk.cyan("status")} ${chalk.dim("[id]")}            View incidents
    ${chalk.cyan("fix")} ${chalk.dim("<id>")}               Review generated fix
    ${chalk.cyan("postmortem")} ${chalk.dim("<id>")}        Open incident report

${chalk.bold.white("  Authentication")}
    ${chalk.cyan("auth login")}             Open web login and save API key
    ${chalk.cyan("auth status")}            View auth status
    ${chalk.cyan("auth logout")}            Remove credentials

${chalk.bold.white("  Options")}
    ${chalk.dim("--mock")}                 Use local simulation mode
    ${chalk.dim("-h, --help")}             Show help
    ${chalk.dim("-v, --version")}          Show version
`;

const argv = process.argv.slice(2);
const noArgs = argv.length === 0;
const isMainHelp =
  argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h");
const isResolve = argv[0] === "resolve" || argv[0] === "investigate";

// `sherlock` with no args → launch the interactive shell.
// The shell prints its own banner; index.ts stays out of its way.
if (noArgs) {
  checkForUpdate()
    .then(() => runShell())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(chalk.red("✗ Shell crashed: ") + (err?.message ?? err));
      process.exit(1);
    });
} else if (isMainHelp) {
  console.log(BANNER);
  console.log(HELP_TEXT);
  process.exit(0);
} else {
  await checkForUpdate();

  // Cinematic banner only for the headline `resolve` one-shot.
  if (isResolve) console.log(BANNER);

  const program = new Command();
  program
    .name("sherlock-cli")
    .description("AI Incident Response Co-pilot")
    .version(currentVersion(), "-v, --version", "Show version")
    .option("--mock", "Use local simulation mode (no backend required)");

  program.addCommand(authCommand);
  program.addCommand(investigateCommand);
  program.addCommand(statusCommand);
  program.addCommand(fixCommand);
  program.addCommand(postmortemCommand);

  program.parse();
}
