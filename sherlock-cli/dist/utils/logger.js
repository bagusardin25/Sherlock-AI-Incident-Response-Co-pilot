import chalk from "chalk";
export const log = {
    section: (name, color) => {
        console.log(color.bold(`\n[${name.toUpperCase()}]`));
    },
    kv: (key, value) => {
        console.log(`  ${chalk.dim(key + ":")} ${value}`);
    },
    success: (msg) => console.log(chalk.green(`  ✓ ${msg}`)),
    error: (msg) => console.log(chalk.red(`  ✗ ${msg}`)),
    info: (msg) => console.log(chalk.dim(`  ℹ ${msg}`)),
    warn: (msg) => console.log(chalk.yellow(`  ⚠ ${msg}`)),
    diff: (patch) => {
        for (const line of patch.split("\n")) {
            if (line.startsWith("+"))
                console.log(chalk.green(`  ${line}`));
            else if (line.startsWith("-"))
                console.log(chalk.red(`  ${line}`));
            else if (line.startsWith("@@"))
                console.log(chalk.cyan(`  ${line}`));
            else
                console.log(chalk.dim(`  ${line}`));
        }
    },
    severity: (level) => {
        const colors = {
            critical: chalk.bgRed.white.bold,
            high: chalk.red.bold,
            medium: chalk.yellow.bold,
            low: chalk.green.bold,
        };
        return (colors[level.toLowerCase()] || chalk.white)(level.toUpperCase());
    },
};
