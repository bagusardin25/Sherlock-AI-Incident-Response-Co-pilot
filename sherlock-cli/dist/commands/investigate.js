import { Command } from "commander";
import fs from "fs";
import { runResolvePipeline } from "../shell/pipeline.js";
import { initSession } from "../shell/session.js";
import { failure, info, warn } from "../shell/render.js";
/**
 * One-shot resolve command. Used for scripting / CI:
 *   sherlock resolve crash.log --repo https://github.com/...
 *
 * The interactive shell calls runResolvePipeline directly via /resolve.
 */
export const investigateCommand = new Command("resolve")
    .alias("investigate")
    .description("Resolve a production incident from log file or alert text")
    .argument("<logfile>", "Path to log/alert file or raw error text")
    .option("--repo <url>", "GitHub repository URL", "https://github.com/org/service")
    .option("--dry-run", "Show what would happen without submitting")
    .action(async (logfile, opts) => {
    let rawInput;
    if (fs.existsSync(logfile)) {
        try {
            rawInput = fs.readFileSync(logfile, "utf-8");
        }
        catch (err) {
            failure(`Cannot read ${logfile}: ${err.message ?? err}`);
            return;
        }
    }
    else {
        rawInput = logfile;
    }
    if (opts.dryRun) {
        warn("DRY RUN — no incident will be submitted");
        info(`Input: ${rawInput.slice(0, 200)}${rawInput.length > 200 ? "…" : ""}`);
        info(`Repo:  ${opts.repo}`);
        return;
    }
    await initSession();
    await runResolvePipeline({ rawInput, repoUrl: opts.repo });
});
