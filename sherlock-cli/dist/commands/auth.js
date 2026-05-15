import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
const CONFIG_DIR = path.join(os.homedir(), ".sherlock");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
// ─── helpers (exported so the shell slash commands can reuse them) ───────────
export function shortPath(p) {
    const home = os.homedir();
    if (p.startsWith(home)) {
        return "~" + p.slice(home.length).replace(/\\/g, "/");
    }
    return p;
}
export function maskKey(key) {
    if (key.startsWith("sk_sherlock_")) {
        const rest = key.length - 12;
        return "sk_sherlock_" + "•".repeat(Math.min(32, Math.max(20, rest)));
    }
    if (key.startsWith("sk-")) {
        const rest = key.length - 3;
        return "sk-" + "•".repeat(Math.min(32, Math.max(20, rest)));
    }
    return key.slice(0, 4) + "•".repeat(Math.min(28, Math.max(16, key.length - 4)));
}
export function compactHeader(title) {
    console.log("");
    console.log(chalk.bold.white(title));
    console.log(chalk.dim("─".repeat(title.length)));
}
export function describeConnection(apiUrl) {
    const isLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(apiUrl);
    return isLocal ? `Connected to local backend (${apiUrl})` : "Connected to Sherlock Cloud";
}
export const CONFIG_FILE_PATH = CONFIG_FILE;
export function writeConfig(data) {
    if (!fs.existsSync(CONFIG_DIR))
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    const existing = readConfig();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...existing, ...data }, null, 2));
}
export function clearConfig() {
    if (fs.existsSync(CONFIG_FILE))
        fs.unlinkSync(CONFIG_FILE);
}
function prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
// ─── config persistence ───────────────────────────────────────────────────────
export function readConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
        }
    }
    catch {
        /* ignore */
    }
    return {};
}
function saveConfig(data) {
    writeConfig(data);
}
// ─── command tree ─────────────────────────────────────────────────────────────
export const authCommand = new Command("auth").description("Manage Sherlock authentication");
authCommand
    .command("login")
    .description("Authenticate CLI with your Sherlock API key")
    .option("--api-url <url>", "Sherlock API URL", "http://localhost:8000")
    .action(async (opts) => {
    compactHeader("Sherlock CLI Authentication");
    console.log("");
    console.log(chalk.dim("API key source:"));
    console.log(chalk.dim("Dashboard → Settings → API Keys"));
    console.log("");
    const apiKey = await prompt("Enter API key: ");
    if (!apiKey || (!apiKey.startsWith("sk_sherlock_") && !apiKey.startsWith("sk-"))) {
        console.log("");
        console.log(chalk.red("✗ ") + chalk.white("Invalid API key format"));
        console.log(chalk.dim("Expected prefix: sk_sherlock_..."));
        console.log("");
        return;
    }
    saveConfig({ apiKey, apiUrl: opts.apiUrl });
    console.log("");
    console.log(chalk.green("✓ ") + chalk.white("Authentication complete"));
    console.log(chalk.dim("Saved to ") + chalk.dim(shortPath(CONFIG_FILE)));
    console.log(chalk.dim(describeConnection(opts.apiUrl)));
    console.log("");
});
authCommand
    .command("status")
    .description("Show current authentication status")
    .action(() => {
    const cfg = readConfig();
    compactHeader("Sherlock CLI · Auth Status");
    if (cfg.apiKey) {
        const apiUrl = cfg.apiUrl || "http://localhost:8000";
        console.log("");
        console.log(chalk.green("✓ ") + chalk.white("Authenticated"));
        console.log(chalk.dim("Key       ") + maskKey(cfg.apiKey));
        console.log(chalk.dim("Endpoint  ") + apiUrl);
        console.log(chalk.dim("Config    ") + shortPath(CONFIG_FILE));
        console.log(chalk.dim("Status    ") + describeConnection(apiUrl));
        console.log("");
    }
    else {
        console.log("");
        console.log(chalk.yellow("⚠ ") + chalk.white("Not authenticated"));
        console.log(chalk.dim("Run: sherlock auth login"));
        console.log("");
    }
});
authCommand
    .command("logout")
    .description("Remove stored credentials")
    .action(() => {
    compactHeader("Sherlock CLI · Logout");
    if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
        console.log("");
        console.log(chalk.green("✓ ") + chalk.white("Credentials removed"));
        console.log("");
    }
    else {
        console.log("");
        console.log(chalk.dim("No credentials found"));
        console.log("");
    }
});
