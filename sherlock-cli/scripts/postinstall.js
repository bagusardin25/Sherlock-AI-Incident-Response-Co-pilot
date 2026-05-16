#!/usr/bin/env node

const backendUrl = process.env.SHERLOCK_API_URL || "https://sherlock-ai.up.railway.app";
const loginUrl = `${backendUrl.replace(/\/+$/, "")}/api/auth/google/login`;

console.log(`
Sherlock CLI installed.

Start the CLI:
  sherlock-cli

Authenticate:
  1. Run: sherlock-cli auth login
  2. Open the web login/API key page when prompted:
     ${loginUrl}
  3. Create an API key in Settings > API Keys, then paste it into the CLI.

Alias available:
  sherlock
`);
