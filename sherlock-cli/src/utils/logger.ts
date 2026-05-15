import chalk from "chalk";

export const log = {
  section: (name: string, color: typeof chalk.red) => {
    console.log(color.bold(`\n[${ name.toUpperCase() }]`));
  },
  kv: (key: string, value: string) => {
    console.log(`  ${chalk.dim(key + ":")} ${value}`);
  },
  success: (msg: string) => console.log(chalk.green(`  ✓ ${msg}`)),
  error: (msg: string) => console.log(chalk.red(`  ✗ ${msg}`)),
  info: (msg: string) => console.log(chalk.dim(`  ℹ ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(`  ⚠ ${msg}`)),
  diff: (patch: string) => {
    for (const line of patch.split("\n")) {
      if (line.startsWith("+")) console.log(chalk.green(`  ${line}`));
      else if (line.startsWith("-")) console.log(chalk.red(`  ${line}`));
      else if (line.startsWith("@@")) console.log(chalk.cyan(`  ${line}`));
      else console.log(chalk.dim(`  ${line}`));
    }
  },
  severity: (level: string) => {
    const colors: Record<string, typeof chalk.red> = {
      critical: chalk.bgRed.white.bold,
      high: chalk.red.bold,
      medium: chalk.yellow.bold,
      low: chalk.green.bold,
    };
    return (colors[level.toLowerCase()] || chalk.white)(level.toUpperCase());
  },
};
