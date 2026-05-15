import { Command } from "commander";
/**
 * One-shot resolve command. Used for scripting / CI:
 *   sherlock resolve crash.log --repo https://github.com/...
 *
 * The interactive shell calls runResolvePipeline directly via /resolve.
 */
export declare const investigateCommand: Command;
