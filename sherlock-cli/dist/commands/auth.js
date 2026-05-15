import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
const CONFIG_DIR = path.join(os.homedir(), ".sherlock");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
function prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
    });
}
export function readConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
        }
    }
    catch { /* ignore */ }
    return {};
}
function saveConfig(data) {
    if (!fs.existsSync(CONFIG_DIR))
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    const existing = readConfig();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...existing, ...data }, null, 2));
}
export const authCommand = new Command("auth")
    .description("Manage Sherlock authentication");
authCommand
    .command("login")
    .description("Authenticate CLI with your Sherlock API key")
    .action(async () => {
    console.log(chalk.cyan("\n  🔐 Sherlock CLI Authentication\n"));
    console.log(chalk.dim("  Get your API key from: Sherlock Dashboard → Settings → Developer\n"));
    const apiKey = await prompt(chalk.white("  Paste your Sherlock API key: "));
    if (!apiKey || !apiKey.startsWith("sk_sherlock_")) {
        console.log(chalk.red("\n  ✗ Invalid API key. Expected format: sk_sherlock_xxxxxxxxx"));
        return;
    }
    saveConfig({ apiKey });
    console.log(chalk.green("\n  ✓ Authenticated successfully!"));
    console.log(chalk.dim(`  Config saved to ${CONFIG_FILE}\n`));
});
authCommand
    .command("status")
    .description("Show current authentication status")
    .action(() => {
    const cfg = readConfig();
    if (cfg.apiKey) {
        const masked = cfg.apiKey.slice(0, 14) + "..." + cfg.apiKey.slice(-4);
        console.log(chalk.green(`\n  ✓ Authenticated`));
        console.log(chalk.dim(`  Key: ${masked}`));
        console.log(chalk.dim(`  API: ${cfg.apiUrl || "http://localhost:8000"}`));
        console.log(chalk.dim(`  Config: ${CONFIG_FILE}\n`));
    }
    else {
        console.log(chalk.yellow("\n  ⚠ Not authenticated. Run: sherlock auth login\n"));
    }
});
authCommand
    .command("logout")
    .description("Remove stored credentials")
    .action(() => {
    if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
        console.log(chalk.green("\n  ✓ Logged out. Credentials removed.\n"));
    }
    else {
        console.log(chalk.dim("\n  No credentials found.\n"));
    }
});
