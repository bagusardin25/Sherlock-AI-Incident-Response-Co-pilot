#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { investigateCommand } from "./commands/investigate.js";
import { statusCommand } from "./commands/status.js";
import { fixCommand } from "./commands/fix.js";
import { postmortemCommand } from "./commands/postmortem.js";
import { authCommand } from "./commands/auth.js";
const BANNER = `
${chalk.cyan.bold("╔═══════════════════════════════════════════════╗")}
${chalk.cyan.bold("║")}  ${chalk.white.bold("🔍 SHERLOCK")} ${chalk.dim("— AI Incident Response Co-pilot")}  ${chalk.cyan.bold("║")}
${chalk.cyan.bold("║")}  ${chalk.dim("Powered by IBM Bob │ From alert to fix in 5m")} ${chalk.cyan.bold("║")}
${chalk.cyan.bold("╚═══════════════════════════════════════════════╝")}
`;
const program = new Command();
program
    .name("sherlock")
    .description("AI Incident Response Co-pilot CLI")
    .version("1.0.0")
    .option("--mock", "Force mock mode (no backend required)")
    .hook("preAction", () => {
    console.log(BANNER);
});
program.addCommand(authCommand);
program.addCommand(investigateCommand.alias("resolve"));
program.addCommand(statusCommand);
program.addCommand(fixCommand);
program.addCommand(postmortemCommand);
program.parse();
