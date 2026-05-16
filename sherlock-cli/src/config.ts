import "dotenv/config";
import { readConfig } from "./commands/auth.js";

// Available API endpoints.
const API_URLS = {
  local: "http://localhost:8000",
  production: "https://sherlock-ai.up.railway.app",
};

const DEFAULT_DASHBOARD_URL = "https://sherlockai-ibm.vercel.app";

function cleanApiKey(value?: string): string {
  const apiKey = value?.trim() ?? "";
  return apiKey === "your-api-key-here" ? "" : apiKey;
}

function cleanUrl(value?: string, fallback = ""): string {
  return (value?.trim() || fallback).replace(/\/+$/, "");
}

function readRuntimeConfig() {
  const fileConfig = readConfig();
  const apiUrl = cleanUrl(process.env.SHERLOCK_API_URL || fileConfig.apiUrl, API_URLS.production);
  return {
    apiUrl,
    apiKey: cleanApiKey(process.env.SHERLOCK_API_KEY || fileConfig.apiKey),
    webLoginUrl: cleanUrl(process.env.SHERLOCK_WEB_LOGIN_URL, `${apiUrl}/api/auth/google/login`),
    dashboardUrl: cleanUrl(
      process.env.SHERLOCK_DASHBOARD_URL || process.env.SHERLOCK_FRONTEND_URL,
      DEFAULT_DASHBOARD_URL,
    ),
    mockMode: process.env.SHERLOCK_MOCK === "true",
    urls: API_URLS,
  };
}

export const config = {
  // Priority: env var -> config file -> deployed backend.
  // Local development is opt-in via SHERLOCK_API_URL or `sherlock auth login --api-url`.
  ...readRuntimeConfig(),
};

export function reloadConfig() {
  Object.assign(config, readRuntimeConfig());
  return config;
}

export function isMockMode(): boolean {
  const args = process.argv;
  return config.mockMode || args.includes("--mock");
}
