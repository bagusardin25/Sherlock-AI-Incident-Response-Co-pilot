import "dotenv/config";
import { readConfig } from "./commands/auth.js";

const fileConfig = readConfig();

// Available API endpoints
const API_URLS = {
  local: "http://localhost:8000",
  production: "https://sherlock-ai.up.railway.app",
};

export const config = {
  // Priority: env var → config file → production URL
  apiUrl:
    process.env.SHERLOCK_API_URL ||
    fileConfig.apiUrl ||
    API_URLS.production,
  apiKey: process.env.SHERLOCK_API_KEY || fileConfig.apiKey || "",
  mockMode: process.env.SHERLOCK_MOCK === "true",
  urls: API_URLS,
};

export function isMockMode(): boolean {
  const args = process.argv;
  return config.mockMode || args.includes("--mock");
}
