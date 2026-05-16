import "dotenv/config";
import { readConfig } from "./commands/auth.js";
const fileConfig = readConfig();
export const config = {
    apiUrl: process.env.SHERLOCK_API_URL || fileConfig.apiUrl || "http://localhost:8000",
    apiKey: process.env.SHERLOCK_API_KEY || fileConfig.apiKey || "",
    mockMode: process.env.SHERLOCK_MOCK === "true",
};
export function isMockMode() {
    const args = process.argv;
    return config.mockMode || args.includes("--mock");
}
