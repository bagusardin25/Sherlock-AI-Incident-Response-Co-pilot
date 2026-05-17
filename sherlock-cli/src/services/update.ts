import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

const PACKAGE_NAME = "sherlockibm-cli";
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
const CACHE_DIR = path.join(os.homedir(), ".sherlock");
const CACHE_FILE = path.join(CACHE_DIR, "update-check.json");
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CHECK_TIMEOUT_MS = 1500;

interface UpdateCache {
  checkedAt: number;
  latestVersion?: string;
}

interface PackageJson {
  version?: string;
}

function readJson<T>(file: string): T | null {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return null;
  }
}

function writeCache(cache: UpdateCache): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {
    /* update checks must never block normal CLI usage */
  }
}

export function currentVersion(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packagePath = path.resolve(here, "..", "..", "package.json");
  return readJson<PackageJson>(packagePath)?.version ?? "0.0.0";
}

function parseVersion(version: string): number[] {
  return version
    .replace(/^[^\d]*/, "")
    .split(/[.-]/)
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10) || 0);
}

function isNewerVersion(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
  }
  return false;
}

async function fetchLatestVersion(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(REGISTRY_URL, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as PackageJson;
    return data.version ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkForUpdate(): Promise<void> {
  if (process.env.SHERLOCK_DISABLE_UPDATE_CHECK === "true") return;
  if (process.env.CI === "true") return;

  const current = currentVersion();
  const cached = readJson<UpdateCache>(CACHE_FILE);
  const now = Date.now();
  let latest: string | null | undefined = cached?.latestVersion;

  if (!cached || now - cached.checkedAt > CACHE_TTL_MS) {
    latest = await fetchLatestVersion();
    const latestVersion = latest ?? cached?.latestVersion;
    writeCache({ checkedAt: now, ...(latestVersion ? { latestVersion } : {}) });
  }

  if (latest && isNewerVersion(latest, current)) {
    console.log("");
    console.log(
      chalk.yellow("Update available: ") +
        chalk.white(`${PACKAGE_NAME} ${current} -> ${latest}`),
    );
    console.log(chalk.dim(`Run: npm install -g ${PACKAGE_NAME}@latest`));
    console.log("");
  }
}
