**User:**

<task>
Review the sherlock-cli shell implementation. Suggest error handling improvements for the slash-command dispatcher.
</task>
<environment_details>
# VSCode Visible Files
bob_session\bob_task_may-16-2026_12-37-12-am.md

# VSCode Open Tabs
bob_session/bob_ide_task_reports/backend_scaffolding.md,bob_session/bob_ide_task_reports/cli_iterations.md,bob_session/bob_task_may-16-2026_12-37-12-am.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-17T11:29:25.416Z
User time zone: Asia/Jakarta, UTC+7:00

# Current Cost
$0.00

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>


# Current Workspace Directory (d:/Sherlock) Files
.gitignore
docker-compose.yml
ibm_bob_hackathon.md
README.md
backend/
backend/.dockerignore
backend/.env.example
backend/.gitignore
backend/alembic.ini
backend/check_db.py
backend/create_tables.py
backend/Dockerfile
backend/package-lock.json
backend/Procfile
backend/README.md
backend/requirements.txt
backend/run.py
backend/runtime.txt
backend/test_ai_integration.py
backend/test_pipeline_full.py
backend/test_quick.py
backend/alembic/
backend/alembic/env.py
backend/alembic/script.py.mako
backend/alembic/versions/
backend/alembic/versions/001_initial_schema.py
backend/alembic/versions/1b2f02b1d456_add_postmortem_text_to_incidents.py
backend/alembic/versions/002_add_users_table.py
backend/app/
backend/app/__init__.py
backend/app/bob_client.py
backend/app/config.py
backend/app/database.py
backend/app/main.py
backend/app/openrouter_client.py
backend/app/agents/
backend/app/agents/bob_analyst.py
backend/app/agents/fix.py
backend/app/agents/forensics.py
backend/app/agents/postmortem.py
backend/app/agents/triage.py
backend/app/api/
backend/app/api/__init__.py
backend/app/api/api_keys.py
backend/app/api/auth.py
backend/app/api/incidents.py
backend/app/auth/
backend/app/auth/dependencies.py
backend/app/auth/security.py
backend/app/models/
backend/app/models/api_key.py
backend/app/models/db_models.py
backend/app/models/state.py
backend/app/models/user.py
backend/app/orchestrator/
backend/app/orchestrator/pipeline.py
backend/app/services/
backend/app/services/github_service.py
backend/app/services/incident_service.py
backend/app/services/repo_manager.py
backend/app/services/user_service.py
backend/tests/
backend/tests/agents/
bob_session/
bob_session/bob_task_may-16-2026_12-37-12-am.md
bob_session/bob_ide_task_reports/
bob_session/bob_ide_task_reports/backend_scaffolding.md
bob_session/bob_ide_task_reports/cli_iterations.md
fixtures/
fixtures/alerts/
fixtures/alerts/alert_race_condition.json
fixtures/bob_responses/
fixtures/bob_responses/fix_proposal.json
fixtures/bob_responses/root_cause_analysis.json
fixtures/flaky-shop/
fixtures/flaky-shop/package.json
fixtures/flaky-shop/README.md
fixtures/flaky-shop/src/
fixtures/flaky-shop/src/cart/
fixtures/flaky-shop/src/cart/checkout.ts
fixtures/flaky-shop/src/inventory/
fixtures/flaky-shop/src/inventory/service.ts
frontend/
frontend/.dockerignore
frontend/.env.example
frontend/.eslintrc.json
frontend/Dockerfile
frontend/next-env.d.ts
frontend/next.config.js
frontend/package-lock.json
frontend/package.json
frontend/postcss.config.js
frontend/README.md
frontend/tailwind.config.ts
frontend/tsconfig.json
frontend/vercel.json
frontend/app/
frontend/app/globals.css
frontend/app/layout.tsx
frontend/app/page.tsx
frontend/app/providers.tsx
frontend/app/api/
frontend/app/api/[...path]/
frontend/app/api/[...path]/route.ts
frontend/app/auth/
frontend/app/auth/callback/
frontend/app/auth/callback/page.tsx
frontend/app/auth/login/
frontend/app/auth/login/page.tsx
frontend/app/auth/register/
frontend/app/auth/register/page.tsx
frontend/app/docs/
frontend/app/docs/layout.tsx
frontend/app/docs/page.tsx
frontend/app/incidents/
frontend/app/incidents/[id]/
frontend/app/incidents/[id]/page.tsx
frontend/app/scanner/
frontend/app/scanner/page.tsx
frontend/app/settings/
frontend/app/settings/api-keys/
frontend/app/settings/api-keys/page.tsx
frontend/components/
frontend/components/AgentCard.tsx
frontend/components/CodeBlock.tsx
frontend/components/CommandPalette.tsx
frontend/lib/
frontend/lib/api-error.ts
frontend/lib/auth.tsx
frontend/lib/oauth.ts
frontend/public/
sherlock-cli/
sherlock-cli/.env.example
sherlock-cli/package-lock.json
sherlock-cli/package.json
sherlock-cli/README.md
sherlock-cli/tsconfig.json
sherlock-cli/scripts/
sherlock-cli/scripts/postinstall.js
sherlock-cli/src/
sherlock-cli/src/config.ts
sherlock-cli/src/index.ts
sherlock-cli/src/commands/
sherlock-cli/src/commands/auth.ts
sherlock-cli/src/commands/fix.ts
sherlock-cli/src/commands/investigate.ts
sherlock-cli/src/commands/postmortem.ts
sherlock-cli/src/commands/status.ts
sherlock-cli/src/services/
sherlock-cli/src/services/api.ts
sherlock-cli/src/services/client.ts
sherlock-cli/src/services/mock.ts
sherlock-cli/src/services/update.ts
sherlock-cli/src/shell/
sherlock-cli/src/shell/commands.ts
sherlock-cli/src/shell/pipeline.ts
sherlock-cli/src/shell/render.ts
sherlock-cli/src/shell/repl.ts
sherlock-cli/src/shell/session.ts
sherlock-cli/src/shell/views.ts
sherlock-cli/src/utils/
sherlock-cli/src/utils/opener.ts
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

I'll review the sherlock-cli shell implementation, focusing on the slash-command dispatcher and error handling. Let me start by examining the relevant files.

<read_file>
<args>
<file>
<path>sherlock-cli/src/shell/repl.ts</path>
</file>
<file>
<path>sherlock-cli/src/shell/commands.ts</path>
</file>
<file>
<path>sherlock-cli/src/shell/session.ts</path>
</file>
</args>
</read_file>

---

**User:**

[read_file for 'sherlock-cli/src/shell/repl.ts', 'sherlock-cli/src/shell/commands.ts', 'sherlock-cli/src/shell/session.ts'] Result:
<files>
<file><path>sherlock-cli/src/shell/repl.ts</path>
<content lines="1-223">
  1 | import readline from "readline";
  2 | import chalk from "chalk";
  3 | import { select, search, input, password } from "@inquirer/prompts";
  4 | 
  5 | import { initSession, getSession, modeLabel } from "./session.js";
  6 | import { dispatchCommand, type AskFn } from "./commands.js";
  7 | import { blank, info, warn } from "./render.js";
  8 | 
  9 | const SHELL_BANNER = `
 10 | ${chalk.cyan.bold("╔════════════════════════════════════════════════════════╗")}
 11 | ${chalk.cyan.bold("║")}  ${chalk.white.bold("Sherlock Incident Response Shell")}                      ${chalk.cyan.bold("║")}
 12 | ${chalk.cyan.bold("║")}  ${chalk.dim("Powered by IBM Bob repository intelligence")}            ${chalk.cyan.bold("║")}
 13 | ${chalk.cyan.bold("╚════════════════════════════════════════════════════════╝")}
 14 | `;
 15 | 
 16 | function renderSessionHeader() {
 17 |   const sess = getSession();
 18 |   const authStr = sess.authenticated
 19 |     ? chalk.green("yes")
 20 |     : chalk.yellow("no — select /auth login");
 21 |   console.log(chalk.dim(modeLabel(sess.mode, sess.autoFallbackMock)));
 22 |   if (sess.mode === "mock") {
 23 |     warn("MOCK MODE - not using IBM Bob. Results are illustrative only.");
 24 |   }
 25 |   console.log(chalk.dim("Workspace      ") + chalk.white(sess.workspace));
 26 |   console.log(chalk.dim("Backend        ") + chalk.white(sess.apiUrl));
 27 |   console.log(chalk.dim("Authenticated  ") + authStr);
 28 |   if (!sess.authenticated) {
 29 |     console.log(chalk.dim("Next           ") + chalk.white("Run /auth login to open web login and create an API key"));
 30 |   }
 31 |   blank();
 32 |   info(`Type ${chalk.cyan("/")} for command palette`);
 33 |   blank();
 34 | }
 35 | 
 36 | function buildPromptLabel(): string {
 37 |   const sess = getSession();
 38 |   const mode = sess.mode === "mock" ? "[MOCK] " : "";
 39 |   if (sess.activeIncident) return `${mode}sherlock(${sess.activeIncident}) >`;
 40 |   return `${mode}sherlock >`;
 41 | }
 42 | 
 43 | // ─── Command palette choices ─────────────────────────────────────────────────
 44 | 
 45 | const PALETTE_CHOICES = [
 46 |   { name: "/resolve        Resolve a production incident", value: "resolve" },
 47 |   { name: "/status         List incidents or show detail", value: "status" },
 48 |   { name: "/fix            Show generated fix", value: "fix" },
 49 |   { name: "/postmortem     Show incident report", value: "postmortem" },
 50 |   { name: "/verify         Show fix verification steps", value: "verify" },
 51 |   { name: "/open           Open in web dashboard", value: "open" },
 52 |   { name: "/history        Session history", value: "history" },
 53 |   { name: "/switch         Switch active incident", value: "switch" },
 54 |   { name: "/incidents list List known incidents", value: "incidents list" },
 55 |   { name: "/agents         Show multi-agent pipeline", value: "agents" },
 56 |   { name: "/auth login     Authenticate CLI", value: "auth login" },
 57 |   { name: "/auth status    Auth status", value: "auth status" },
 58 |   { name: "/auth logout    Remove credentials", value: "auth logout" },
 59 |   { name: "/clear          Clear screen", value: "clear" },
 60 |   { name: "/help           Show help", value: "help" },
 61 |   { name: "/exit           Leave the shell", value: "exit" },
 62 | ];
 63 | 
 64 | // ─── Ask function for sub-prompts ────────────────────────────────────────────
 65 | 
 66 | const ask: AskFn = async (question, opts) => {
 67 |   try {
 68 |     if (opts?.mask) {
 69 |       return await password({ message: question, mask: "•" });
 70 |     }
 71 |     return await input({ message: question });
 72 |   } catch {
 73 |     return "";
 74 |   }
 75 | };
 76 | 
 77 | // ─── Main REPL loop ──────────────────────────────────────────────────────────
 78 | 
 79 | export async function runShell(): Promise<void> {
 80 |   if (!process.stdout.isTTY) {
 81 |     console.error(
 82 |       chalk.yellow(
 83 |         "Sherlock shell requires an interactive terminal.\n" +
 84 |           "Use one-shot mode for scripts and CI: sherlock <command>",
 85 |       ),
 86 |     );
 87 |     process.exit(1);
 88 |   }
 89 | 
 90 |   await initSession();
 91 | 
 92 |   console.log(SHELL_BANNER);
 93 |   renderSessionHeader();
 94 | 
 95 |   while (true) {
 96 |     // Wait for user to press a key. If it's "/", show the palette dropdown.
 97 |     // Otherwise collect a full line for direct command input.
 98 |     const line = await waitForInput();
 99 | 
100 |     if (line === null) {
101 |       // EOF / Ctrl+C
102 |       blank();
103 |       info("Session closed.");
104 |       blank();
105 |       return;
106 |     }
107 | 
108 |     const trimmed = line.trim();
109 |     if (!trimmed) continue;
110 | 
111 |     const result = await dispatchCommand(trimmed, ask);
112 |     if (result === "exit") return;
113 |   }
114 | }
115 | 
116 | // ─── Input handler: detects "/" and pops palette, otherwise reads a line ──────
117 | 
118 | function waitForInput(): Promise<string | null> {
119 |   return new Promise((resolve) => {
120 |     const prompt = buildPromptLabel();
121 |     process.stdout.write(chalk.cyan(prompt) + " ");
122 |     waitForKey(prompt, resolve);
123 |   });
124 | }
125 | 
126 | function waitForKey(prompt: string, resolve: (val: string | null) => void) {
127 |   if (process.stdin.isTTY) {
128 |     process.stdin.setRawMode(true);
129 |   }
130 |   process.stdin.resume();
131 |   process.stdin.once("data", (buf) => {
132 |     const ch = buf.toString();
133 | 
134 |     // Ctrl+C or Ctrl+D
135 |     if (ch === "\x03" || ch === "\x04") {
136 |       if (process.stdin.isTTY) process.stdin.setRawMode(false);
137 |       process.stdin.pause();
138 |       resolve(null);
139 |       return;
140 |     }
141 | 
142 |     // Backspace / Delete / Escape / arrow keys — swallow silently, keep waiting
143 |     if (
144 |       ch === "\x7f" || ch === "\x08" ||
145 |       ch === "\x1b[3~" || ch === "\x1b" ||
146 |       ch.startsWith("\x1b[")
147 |     ) {
148 |       // Multi-byte escape sequences are delivered in a single buffer,
149 |       // so there is nothing extra to drain. Just keep waiting.
150 |       waitForKey(prompt, resolve);
151 |       return;
152 |     }
153 | 
154 |     // Enter / newline with nothing typed — just keep waiting
155 |     if (ch === "\r" || ch === "\n" || ch === "\r\n") {
156 |       waitForKey(prompt, resolve);
157 |       return;
158 |     }
159 | 
160 |     // "/" → enter command search mode: collect more chars to filter, then show palette
161 |     if (ch === "/") {
162 |       if (process.stdin.isTTY) process.stdin.setRawMode(false);
163 |       process.stdin.pause();
164 |       // Clear the prompt line so the palette renders cleanly
165 |       process.stdout.write("\r" + " ".repeat(prompt.length + 2) + "\r");
166 |       collectAndShowPalette("").then((choice) => {
167 |         if (!choice) {
168 |           resolve("");
169 |         } else {
170 |           resolve(`/${choice}`);
171 |         }
172 |       });
173 |       return;
174 |     }
175 | 
176 |     // Any other character → switch to readline for full line input
177 |     if (process.stdin.isTTY) process.stdin.setRawMode(false);
178 |     process.stdin.pause();
179 | 
180 |     const firstChar = ch.replace(/[\r\n]/g, "");
181 |     if (!firstChar) {
182 |       waitForKey(prompt, resolve);
183 |       return;
184 |     }
185 | 
186 |     // Use readline to collect the rest of the line
187 |     const rl = readline.createInterface({
188 |       input: process.stdin,
189 |       output: process.stdout,
190 |       terminal: true,
191 |       prompt: "",
192 |     });
193 | 
194 |     // Write the first char so user sees it
195 |     process.stdout.write(firstChar);
196 |     rl.question("", (rest) => {
197 |       rl.close();
198 |       resolve(firstChar + rest);
199 |     });
200 |   });
201 | }
202 | 
203 | async function collectAndShowPalette(initialFilter: string): Promise<string | null> {
204 |   try {
205 |     const choice = await search<string>({
206 |       message: buildPromptLabel(),
207 |       source: (term) => {
208 |         const filter = (term ?? initialFilter).toLowerCase();
209 |         if (!filter) return PALETTE_CHOICES;
210 |         return PALETTE_CHOICES.filter(
211 |           (c) => c.name.toLowerCase().includes(filter) || c.value.toLowerCase().includes(filter),
212 |         );
213 |       },
214 |     });
215 |     return choice;
216 |   } catch {
217 |     return null;
218 |   }
219 | }
220 | 
221 | async function showPalette(): Promise<string | null> {
222 |   return collectAndShowPalette("");
223 | }
</content>
</file>
<file><path>sherlock-cli/src/shell/commands.ts</path>
<content lines="1-572">
  1 | import fs from "fs";
  2 | import chalk from "chalk";
  3 | 
  4 | import {
  5 |   readConfig,
  6 |   writeConfig,
  7 |   clearConfig,
  8 |   maskKey,
  9 |   shortPath,
 10 |   describeConnection,
 11 |   compactHeader,
 12 |   CONFIG_FILE_PATH,
 13 | } from "../commands/auth.js";
 14 | 
 15 | import { useMock, invalidateBackendCache } from "../services/client.js";
 16 | import { getIncidentState, listIncidents, getPostmortem } from "../services/api.js";
 17 | import { mockIncidentList, mockIncidentState, mockPostmortem } from "../services/mock.js";
 18 | 
 19 | import { agentTag, blank, failure, info, rule, success, warn } from "./render.js";
 20 | import { viewIncidentList, viewIncidentDetail, viewFix, viewPostmortem } from "./views.js";
 21 | import { runResolvePipeline } from "./pipeline.js";
 22 | import { getSession, refreshAuth, setActiveIncident } from "./session.js";
 23 | import { openUrl } from "../utils/opener.js";
 24 | import { config } from "../config.js";
 25 | 
 26 | export type DispatchResult = "continue" | "exit";
 27 | 
 28 | /**
 29 |  * Generic prompt function. The shell injects an inquirer-backed implementation;
 30 |  * other surfaces could plug in something else. `mask: true` requests password-style
 31 |  * input.
 32 |  */
 33 | export type AskFn = (question: string, opts?: { mask?: boolean }) => Promise<string>;
 34 | 
 35 | type Handler = (args: string[], ask: AskFn) => Promise<DispatchResult>;
 36 | 
 37 | // ─── command parsing ──────────────────────────────────────────────────────────
 38 | 
 39 | interface ParsedCommand {
 40 |   name: string;
 41 |   args: string[];
 42 | }
 43 | 
 44 | export function parseLine(raw: string): ParsedCommand | null {
 45 |   const trimmed = raw.trim();
 46 |   if (!trimmed) return null;
 47 |   if (!trimmed.startsWith("/")) {
 48 |     return { name: "_unknown", args: [trimmed] };
 49 |   }
 50 |   const parts = trimmed.slice(1).split(/\s+/);
 51 |   return { name: parts[0]?.toLowerCase() ?? "", args: parts.slice(1) };
 52 | }
 53 | 
 54 | // ─── dashboard URL resolution ────────────────────────────────────────────────
 55 | 
 56 | function dashboardBaseUrl(): string {
 57 |   return config.dashboardUrl;
 58 | }
 59 | 
 60 | const DEFAULT_API_URL = "https://sherlock-ai.up.railway.app";
 61 | 
 62 | function normalizeUrl(url: string): string {
 63 |   return url.trim().replace(/\/+$/, "");
 64 | }
 65 | 
 66 | function webLoginUrl(apiUrl: string): string {
 67 |   return normalizeUrl(process.env.SHERLOCK_WEB_LOGIN_URL || `${apiUrl}/api/auth/google/login`);
 68 | }
 69 | 
 70 | // ─── individual handlers ──────────────────────────────────────────────────────
 71 | 
 72 | const helpHandler: Handler = async () => {
 73 |   blank();
 74 |   console.log(chalk.bold.white("  Slash Commands"));
 75 |   console.log("");
 76 |   console.log(`    ${chalk.cyan("/resolve")} ${chalk.dim("<file>")}        Resolve a production incident`);
 77 |   console.log(`    ${chalk.cyan("/status")} ${chalk.dim("[id]")}           List incidents or show detail`);
 78 |   console.log(`    ${chalk.cyan("/fix")} ${chalk.dim("[id]")}              Show generated fix`);
 79 |   console.log(`    ${chalk.cyan("/postmortem")} ${chalk.dim("[id]")}       Show incident report`);
 80 |   console.log(`    ${chalk.cyan("/verify")} ${chalk.dim("[id]")}           Show verification steps for the fix`);
 81 |   console.log(`    ${chalk.cyan("/open")} ${chalk.dim("[id]")}             Open incident in web dashboard`);
 82 |   console.log(`    ${chalk.cyan("/history")}                Show this session's incidents`);
 83 |   console.log(`    ${chalk.cyan("/switch")} ${chalk.dim("<id>")}           Switch active incident`);
 84 |   console.log(`    ${chalk.cyan("/incidents list")}         List known incidents`);
 85 |   console.log(`    ${chalk.cyan("/agents")}                 Show the multi-agent pipeline`);
 86 |   console.log("");
 87 |   console.log(`    ${chalk.cyan("/auth login")}             Authenticate the CLI`);
 88 |   console.log(`    ${chalk.cyan("/auth status")}            Show authentication status`);
 89 |   console.log(`    ${chalk.cyan("/auth logout")}            Remove stored credentials`);
 90 |   console.log("");
 91 |   console.log(`    ${chalk.cyan("/clear")}                  Clear the screen`);
 92 |   console.log(`    ${chalk.cyan("/help")}                   Show this help`);
 93 |   console.log(`    ${chalk.cyan("/exit")}                   Leave the shell`);
 94 |   console.log("");
 95 |   console.log(chalk.dim("  Tip: when an incident is active, /fix /postmortem /open use it automatically."));
 96 |   blank();
 97 |   return "continue";
 98 | };
 99 | 
100 | const exitHandler: Handler = async () => {
101 |   blank();
102 |   info("Session closed.");
103 |   blank();
104 |   return "exit";
105 | };
106 | 
107 | const clearHandler: Handler = async () => {
108 |   console.clear();
109 |   return "continue";
110 | };
111 | 
112 | function showMockNotice() {
113 |   const sess = getSession();
114 |   if (sess.mode === "mock") {
115 |     warn("MOCK MODE - not using IBM Bob. Results are illustrative only.");
116 |     if (sess.autoFallbackMock) info(`Backend unreachable: ${sess.apiUrl}`);
117 |   }
118 | }
119 | 
120 | const resolveHandler: Handler = async (args, ask) => {
121 |   const sess = getSession();
122 |   const mock = await useMock();
123 | 
124 |   // Auth guard: block unauthenticated users unless in mock mode
125 |   if (!sess.authenticated && !mock) {
126 |     blank();
127 |     failure("Authentication required");
128 |     info("You must be logged in to run incident analysis against the backend.");
129 |     info(`Run ${chalk.cyan("/auth login")} to authenticate with your API key.`);
130 |     blank();
131 |     return "continue";
132 |   }
133 | 
134 |   let target = args.join(" ").trim();
135 | 
136 |   // Pull optional --repo <url> from inline args (power-user shorthand)
137 |   let repoUrl = "";
138 |   const repoMatch = target.match(/--repo\s+(\S+)/);
139 |   if (repoMatch) {
140 |     repoUrl = repoMatch[1];
141 |     target = target.replace(repoMatch[0], "").trim();
142 |   }
143 | 
144 |   // Step 1: Get alert / error input
145 |   if (!target) {
146 |     blank();
147 |     console.log(chalk.bold.white("  Step 1 · Incident Input"));
148 |     console.log(chalk.dim("  Paste a stack trace, provide a log file path, or use a sample alert."));
149 |     console.log(chalk.dim(`  Sample: ${chalk.cyan("fixtures/alerts/alert_race_condition.json")}`));
150 |     blank();
151 |     target = await ask("Alert file or error text:");
152 |   }
153 |   if (!target) {
154 |     warn("No input provided.");
155 |     return "continue";
156 |   }
157 | 
158 |   // Step 2: Get repo URL (only prompt if not already provided via --repo)
159 |   if (!repoUrl) {
160 |     const defaultRepo = "https://github.com/bagusardin25/flaky-shop";
161 |     blank();
162 |     console.log(chalk.bold.white("  Step 2 · Target Repository"));
163 |     console.log(chalk.dim(`  Default: ${chalk.cyan(defaultRepo)}`));
164 |     blank();
165 |     const userRepo = await ask("Repository URL (Enter for default):");
166 |     repoUrl = userRepo.trim() || defaultRepo;
167 |   }
168 | 
169 |   let rawInput: string;
170 |   if (fs.existsSync(target)) {
171 |     try {
172 |       rawInput = fs.readFileSync(target, "utf-8");
173 |     } catch (err: any) {
174 |       failure(`Cannot read ${target}: ${err.message ?? err}`);
175 |       return "continue";
176 |     }
177 |   } else {
178 |     rawInput = target;
179 |   }
180 | 
181 |   blank();
182 |   info(`Repository: ${chalk.cyan(repoUrl)}`);
183 |   await runResolvePipeline({ rawInput, repoUrl });
184 |   blank();
185 |   return "continue";
186 | };
187 | 
188 | async function resolveIncidentId(args: string[], ask: AskFn, action: string): Promise<string | null> {
189 |   const sess = getSession();
190 |   if (args[0]) return args[0];
191 |   if (sess.activeIncident) return sess.activeIncident;
192 | 
193 |   const id = (await ask(`Incident ID for ${action}:`)).trim();
194 |   if (!id) return null;
195 |   return id;
196 | }
197 | 
198 | const statusHandler: Handler = async (args, ask) => {
199 |   const sess = getSession();
200 |   const mock = await useMock();
201 |   blank();
202 |   console.log(chalk.bold.white("  Runtime"));
203 |   console.log(chalk.dim("  Mode      ") + chalk.white(sess.mode.toUpperCase()) + (sess.autoFallbackMock ? chalk.yellow(" (auto fallback)") : ""));
204 |   console.log(chalk.dim("  Backend   ") + chalk.white(sess.apiUrl));
205 |   console.log(chalk.dim("  Auth      ") + (sess.authenticated ? chalk.green("yes") : chalk.yellow("no")));
206 |   if (mock) showMockNotice();
207 | 
208 |   // If user passes an id, or has an active incident, show detail.
209 |   // Otherwise, show the list (no need to prompt).
210 |   const id = args[0] ?? sess.activeIncident;
211 | 
212 |   if (id) {
213 |     let state: any;
214 |     try {
215 |       state = mock ? mockIncidentState(id) : await getIncidentState(id);
216 |     } catch (err: any) {
217 |       failure(`Cannot fetch ${id}: ${err.message ?? err}`);
218 |       return "continue";
219 |     }
220 |     viewIncidentDetail(state);
221 |     return "continue";
222 |   }
223 | 
224 |   let incidents: any[];
225 |   try {
226 |     incidents = mock ? mockIncidentList() : await listIncidents();
227 |   } catch (err: any) {
228 |     failure(`Cannot list incidents: ${err.message ?? err}`);
229 |     return "continue";
230 |   }
231 |   viewIncidentList(incidents);
232 |   return "continue";
233 | };
234 | 
235 | const fixHandler: Handler = async (args, ask) => {
236 |   const id = await resolveIncidentId(args, ask, "fix");
237 |   if (!id) {
238 |     warn("No incident ID provided.");
239 |     return "continue";
240 |   }
241 | 
242 |   const mock = await useMock();
243 |   let state: any;
244 |   try {
245 |     state = mock ? mockIncidentState(id) : await getIncidentState(id);
246 |   } catch (err: any) {
247 |     failure(`Cannot fetch ${id}: ${err.message ?? err}`);
248 |     return "continue";
249 |   }
250 |   viewFix(id, state);
251 |   return "continue";
252 | };
253 | 
254 | const verifyHandler: Handler = async (args, ask) => {
255 |   const id = await resolveIncidentId(args, ask, "verify");
256 |   if (!id) {
257 |     warn("No incident ID provided.");
258 |     return "continue";
259 |   }
260 | 
261 |   const mock = await useMock();
262 |   let state: any;
263 |   try {
264 |     state = mock ? mockIncidentState(id) : await getIncidentState(id);
265 |   } catch (err: any) {
266 |     failure(`Cannot fetch ${id}: ${err.message ?? err}`);
267 |     return "continue";
268 |   }
269 | 
270 |   blank();
271 |   console.log(chalk.bold.white(`  Verification plan for ${id}`));
272 |   rule(44);
273 |   if (!state.fix) {
274 |     warn("No fix is available yet.");
275 |     info("Run /fix after the investigation completes.");
276 |     blank();
277 |     return "continue";
278 |   }
279 | 
280 |   const patchPresent = Boolean(state.fix.patch_unified_diff);
281 |   const testPresent = Boolean(state.fix.test_code);
282 |   console.log(chalk.dim("  Patch     ") + (patchPresent ? chalk.green("available") : chalk.yellow("missing")));
283 |   console.log(chalk.dim("  Test      ") + (testPresent ? chalk.green("included") : chalk.yellow("not generated")));
284 |   blank();
285 |   info("Suggested local verification:");
286 |   console.log(chalk.white("  1. Save the fix from /fix to a patch file."));
287 |   console.log(chalk.white("  2. Run git apply fix.patch in the target repository."));
288 |   console.log(chalk.white("  3. Run the repository test suite, for example npm test or the service-specific test command."));
289 |   if (testPresent) {
290 |     console.log(chalk.white("  4. Add the generated regression test before merging."));
291 |   }
292 |   blank();
293 |   return "continue";
294 | };
295 | 
296 | const postmortemHandler: Handler = async (args, ask) => {
297 |   const id = await resolveIncidentId(args, ask, "postmortem");
298 |   if (!id) {
299 |     warn("No incident ID provided.");
300 |     return "continue";
301 |   }
302 | 
303 |   const mock = await useMock();
304 |   let text = "";
305 |   try {
306 |     if (mock) {
307 |       text = mockPostmortem(id);
308 |     } else {
309 |       try {
310 |         const r = await getPostmortem(id);
311 |         text = r.postmortem;
312 |       } catch {
313 |         const state = await getIncidentState(id);
314 |         text = state.postmortem ?? "";
315 |       }
316 |     }
317 |   } catch (err: any) {
318 |     failure(`Cannot fetch postmortem: ${err.message ?? err}`);
319 |     return "continue";
320 |   }
321 |   viewPostmortem(id, text);
322 |   return "continue";
323 | };
324 | 
325 | const historyHandler: Handler = async () => {
326 |   const sess = getSession();
327 |   blank();
328 |   if (!sess.history.length) {
329 |     info("No incidents this session yet.");
330 |     blank();
331 |     return "continue";
332 |   }
333 |   console.log(chalk.bold.white(`  Session history (${sess.history.length})`));
334 |   for (const h of sess.history) {
335 |     const active = sess.activeIncident === h.incidentId ? chalk.green(" (active)") : "";
336 |     const sev = h.severity ? chalk.yellow(h.severity.toUpperCase().padEnd(8)) : chalk.dim("—".padEnd(8));
337 |     console.log(
338 |       `  ${chalk.cyan(h.incidentId.padEnd(16))}  ${sev}  ${(h.service ?? "—").padEnd(20)}${active}`,
339 |     );
340 |   }
341 |   blank();
342 |   return "continue";
343 | };
344 | 
345 | const switchHandler: Handler = async (args, ask) => {
346 |   const sess = getSession();
347 |   let id = args[0]?.trim();
348 | 
349 |   if (!id) {
350 |     if (!sess.history.length) {
351 |       warn("No incidents in this session yet.");
352 |       return "continue";
353 |     }
354 |     blank();
355 |     console.log(chalk.bold.white("  Session incidents"));
356 |     for (const h of sess.history) {
357 |       const active = sess.activeIncident === h.incidentId ? chalk.green(" (active)") : "";
358 |       console.log(`  ${chalk.cyan(h.incidentId)}${active} ${chalk.dim(h.summary ?? "")}`);
359 |     }
360 |     blank();
361 |     id = (await ask("Incident ID to activate:")).trim();
362 |   }
363 | 
364 |   if (!id) {
365 |     warn("No incident ID provided.");
366 |     return "continue";
367 |   }
368 | 
369 |   setActiveIncident(id);
370 |   success(`Active incident: ${id}`);
371 |   blank();
372 |   return "continue";
373 | };
374 | 
375 | const incidentsHandler: Handler = async (args, ask) => {
376 |   const sub = args[0]?.toLowerCase();
377 |   if (!sub || sub === "list" || sub === "ls") {
378 |     return statusHandler([], ask);
379 |   }
380 |   if (sub === "switch") {
381 |     return switchHandler(args.slice(1), ask);
382 |   }
383 |   warn("Usage: /incidents <list|switch>");
384 |   return "continue";
385 | };
386 | 
387 | const openHandler: Handler = async (args, ask) => {
388 |   const sess = getSession();
389 |   const id = args[0] ?? sess.activeIncident;
390 |   const base = dashboardBaseUrl();
391 |   const url = id ? `${base.replace(/\/+$/, "")}/incidents/${id}` : base;
392 | 
393 |   blank();
394 |   if (id) {
395 |     info(`Opening ${chalk.cyan(id)} in dashboard…`);
396 |   } else {
397 |     info("Opening dashboard…");
398 |   }
399 |   info(chalk.dim(url));
400 | 
401 |   const ok = openUrl(url);
402 |   if (!ok) {
403 |     failure("Could not launch browser. Open the URL above manually.");
404 |   } else {
405 |     success("Launched.");
406 |   }
407 |   blank();
408 |   // ask is unused here but kept for handler signature uniformity
409 |   void ask;
410 |   return "continue";
411 | };
412 | 
413 | const agentsHandler: Handler = async () => {
414 |   blank();
415 |   console.log(chalk.bold.white("  Multi-agent Pipeline"));
416 |   rule(40);
417 |   const agents: Array<[string, string, string]> = [
418 |     ["TRIAGE", "Severity, service, error type classification", " "],
419 |     ["FORENSICS", "Git history, blame, suspect commits & files", " "],
420 |     ["ANALYST", "Code-level reasoning over the repo with IBM Bob", "⭐"],
421 |     ["FIX", "Generate unified-diff patch + regression test (Bob)", "⭐"],
422 |     ["POSTMORTEM", "Aggregate findings into incident report", " "],
423 |   ];
424 |   for (const [name, desc, marker] of agents) {
425 |     console.log(`  ${chalk.cyan.bold(`[${name.padEnd(11)}]`)} ${marker} ${chalk.white(desc)}`);
426 |   }
427 |   blank();
428 |   console.log(chalk.dim("  ⭐ = Powered by IBM Bob repository intelligence"));
429 |   blank();
430 |   return "continue";
431 | };
432 | 
433 | // ─── auth slash commands ──────────────────────────────────────────────────────
434 | 
435 | const authHandler: Handler = async (args, ask) => {
436 |   const sub = args[0]?.toLowerCase();
437 |   switch (sub) {
438 |     case "login":
439 |       return authLogin(args.slice(1), ask);
440 |     case "status":
441 |       return authStatus();
442 |     case "logout":
443 |       return authLogout();
444 |     default:
445 |       warn("Usage: /auth <login|status|logout>");
446 |       return "continue";
447 |   }
448 | };
449 | 
450 | async function authLogin(args: string[], ask: AskFn): Promise<DispatchResult> {
451 |   let apiUrl = DEFAULT_API_URL;
452 |   const idx = args.findIndex((a) => a === "--api-url");
453 |   if (idx !== -1 && args[idx + 1]) apiUrl = args[idx + 1];
454 |   apiUrl = normalizeUrl(apiUrl);
455 |   const loginUrl = webLoginUrl(apiUrl);
456 | 
457 |   compactHeader("Sherlock CLI Authentication");
458 |   console.log("");
459 |   console.log(chalk.white("Create your API key in the Sherlock web dashboard."));
460 |   console.log(chalk.dim("After login, open Settings > API Keys, create a key, then paste it here."));
461 |   console.log("");
462 |   console.log(chalk.dim("Web login: ") + chalk.cyan(loginUrl));
463 |   const opened = openUrl(loginUrl);
464 |   console.log(chalk.dim(opened ? "Opening browser..." : "Could not open browser automatically."));
465 |   console.log("");
466 | 
467 |   const apiKey = await ask("Enter API key:", { mask: true });
468 |   if (!apiKey || (!apiKey.startsWith("sk_sherlock_") && !apiKey.startsWith("sk-"))) {
469 |     blank();
470 |     failure("Invalid API key format");
471 |     info("Expected prefix: sk_sherlock_…");
472 |     blank();
473 |     return "continue";
474 |   }
475 | 
476 |   writeConfig({ apiKey, apiUrl });
477 |   invalidateBackendCache();
478 |   await refreshAuth();
479 | 
480 |   blank();
481 |   success("Authentication complete");
482 |   info(`Saved to ${shortPath(CONFIG_FILE_PATH)}`);
483 |   info(describeConnection(apiUrl));
484 |   blank();
485 |   return "continue";
486 | }
487 | 
488 | async function authStatus(): Promise<DispatchResult> {
489 |   const cfg = readConfig();
490 |   compactHeader("Sherlock CLI · Auth Status");
491 |   if (cfg.apiKey) {
492 |     const url = cfg.apiUrl || "http://localhost:8000";
493 |     blank();
494 |     success("Authenticated");
495 |     console.log(chalk.dim("Key       ") + maskKey(cfg.apiKey));
496 |     console.log(chalk.dim("Endpoint  ") + url);
497 |     console.log(chalk.dim("Config    ") + shortPath(CONFIG_FILE_PATH));
498 |     console.log(chalk.dim("Status    ") + describeConnection(url));
499 |     blank();
500 |   } else {
501 |     blank();
502 |     warn("Not authenticated");
503 |     info("Run /auth login or sherlock-cli auth login");
504 |     blank();
505 |   }
506 |   return "continue";
507 | }
508 | 
509 | async function authLogout(): Promise<DispatchResult> {
510 |   compactHeader("Sherlock CLI · Logout");
511 |   blank();
512 |   if (fs.existsSync(CONFIG_FILE_PATH)) {
513 |     clearConfig();
514 |     invalidateBackendCache();
515 |     await refreshAuth();
516 |     success("Credentials removed");
517 |   } else {
518 |     info("No credentials found");
519 |   }
520 |   blank();
521 |   return "continue";
522 | }
523 | 
524 | // ─── main dispatcher ──────────────────────────────────────────────────────────
525 | 
526 | const HANDLERS: Record<string, Handler> = {
527 |   help: helpHandler,
528 |   "?": helpHandler,
529 |   exit: exitHandler,
530 |   quit: exitHandler,
531 |   q: exitHandler,
532 |   clear: clearHandler,
533 |   cls: clearHandler,
534 |   resolve: resolveHandler,
535 |   status: statusHandler,
536 |   fix: fixHandler,
537 |   verify: verifyHandler,
538 |   postmortem: postmortemHandler,
539 |   history: historyHandler,
540 |   switch: switchHandler,
541 |   incidents: incidentsHandler,
542 |   open: openHandler,
543 |   agents: agentsHandler,
544 |   auth: authHandler,
545 | };
546 | 
547 | export async function dispatchCommand(line: string, ask: AskFn): Promise<DispatchResult> {
548 |   const parsed = parseLine(line);
549 |   if (!parsed) return "continue";
550 |   if (parsed.name === "_unknown") {
551 |     warn(`Unknown input. Commands start with ${chalk.cyan("/")}, e.g. ${chalk.cyan("/help")}.`);
552 |     return "continue";
553 |   }
554 | 
555 |   const handler = HANDLERS[parsed.name];
556 |   if (!handler) {
557 |     warn(`Unknown command: /${parsed.name}. Type /help for the list.`);
558 |     return "continue";
559 |   }
560 |   try {
561 |     if (!["help", "?", "clear", "cls", "exit", "quit", "q"].includes(parsed.name)) {
562 |       showMockNotice();
563 |     }
564 |     return await handler(parsed.args, ask);
565 |   } catch (err: any) {
566 |     failure(`Command failed: ${err.message ?? err}`);
567 |     return "continue";
568 |   }
569 | }
570 | 
571 | // agentTag is referenced by viewPostmortem at runtime; suppress unused-import warning.
572 | void agentTag;
</content>
</file>
<file><path>sherlock-cli/src/shell/session.ts</path>
<content lines="1-131">
  1 | import { config, isMockMode, reloadConfig } from "../config.js";
  2 | import { healthCheck } from "../services/api.js";
  3 | 
  4 | export type ConnectionMode = "cloud" | "local" | "mock" | "offline";
  5 | 
  6 | export interface HistoryEntry {
  7 |   incidentId: string;
  8 |   severity?: string;
  9 |   service?: string;
 10 |   summary?: string;
 11 |   timestamp: string;
 12 | }
 13 | 
 14 | export interface SessionState {
 15 |   workspace: string;
 16 |   authenticated: boolean;
 17 |   apiUrl: string;
 18 |   apiKey: string;
 19 |   mode: ConnectionMode;
 20 |   activeIncident: string | null;
 21 |   history: HistoryEntry[];
 22 |   startedAt: Date;
 23 |   /** True when the CLI auto-switched to mock because backend was unreachable. */
 24 |   autoFallbackMock: boolean;
 25 | }
 26 | 
 27 | function classifyMode(apiUrl: string, authenticated: boolean, backendOk: boolean): ConnectionMode {
 28 |   if (isMockMode()) return "mock";
 29 |   if (!backendOk) return "offline";
 30 |   const isLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(apiUrl);
 31 |   if (isLocal) return "local";
 32 |   return authenticated ? "cloud" : "offline";
 33 | }
 34 | 
 35 | let _session: SessionState | null = null;
 36 | 
 37 | export async function initSession(): Promise<SessionState> {
 38 |   const apiUrl = config.apiUrl;
 39 |   const apiKey = config.apiKey;
 40 |   const authenticated = Boolean(apiKey);
 41 | 
 42 |   // Probe backend reachability without crashing the shell on failure.
 43 |   let backendOk = false;
 44 |   if (!isMockMode()) {
 45 |     try {
 46 |       backendOk = await healthCheck();
 47 |     } catch {
 48 |       backendOk = false;
 49 |     }
 50 |   }
 51 | 
 52 |   const mode = classifyMode(apiUrl, authenticated, backendOk);
 53 | 
 54 |   _session = {
 55 |     workspace: process.env.SHERLOCK_WORKSPACE || "production",
 56 |     authenticated,
 57 |     apiUrl,
 58 |     apiKey,
 59 |     mode: mode === "offline" ? "mock" : mode,
 60 |     activeIncident: null,
 61 |     history: [],
 62 |     startedAt: new Date(),
 63 |     autoFallbackMock: mode === "offline",
 64 |   };
 65 |   return _session;
 66 | }
 67 | 
 68 | export function getSession(): SessionState {
 69 |   if (!_session) {
 70 |     throw new Error("Session not initialized — call initSession() first");
 71 |   }
 72 |   return _session;
 73 | }
 74 | 
 75 | export function setActiveIncident(id: string | null) {
 76 |   if (!_session) return;
 77 |   _session.activeIncident = id;
 78 | }
 79 | 
 80 | export function recordIncident(entry: HistoryEntry) {
 81 |   if (!_session) return;
 82 |   // Avoid duplicates: replace if same id, else prepend.
 83 |   _session.history = [entry, ..._session.history.filter((h) => h.incidentId !== entry.incidentId)];
 84 |   if (_session.history.length > 50) _session.history.length = 50;
 85 | }
 86 | 
 87 | export async function refreshAuth(): Promise<SessionState> {
 88 |   // Re-read on-disk config (e.g. after `/auth login`) and re-classify mode.
 89 |   reloadConfig();
 90 |   if (!_session) return initSession();
 91 | 
 92 |   _session.apiUrl = config.apiUrl;
 93 |   _session.apiKey = config.apiKey;
 94 |   _session.authenticated = Boolean(_session.apiKey);
 95 | 
 96 |   let backendOk = false;
 97 |   if (!isMockMode()) {
 98 |     try {
 99 |       backendOk = await healthCheck();
100 |     } catch {
101 |       backendOk = false;
102 |     }
103 |   }
104 |   _session.mode = classifyMode(_session.apiUrl, _session.authenticated, backendOk);
105 | 
106 |   // Auto-fallback to mock when offline
107 |   if (_session.mode === "offline") {
108 |     _session.mode = "mock";
109 |     _session.autoFallbackMock = true;
110 |   } else {
111 |     _session.autoFallbackMock = false;
112 |   }
113 |   return _session;
114 | }
115 | 
116 | // ─── display helpers ──────────────────────────────────────────────────────────
117 | 
118 | export function modeLabel(mode: ConnectionMode, autoFallback = false): string {
119 |   switch (mode) {
120 |     case "cloud":
121 |       return "Connected to Sherlock Cloud";
122 |     case "local":
123 |       return "Connected to local backend";
124 |     case "mock":
125 |       return autoFallback
126 |         ? "Backend unreachable — auto-switched to mock mode"
127 |         : "Mock mode (local simulation)";
128 |     case "offline":
129 |       return "Backend unreachable — auto-switched to mock mode";
130 |   }
131 | }
</content>
</file>
</files>
<environment_details>
# VSCode Visible Files


# VSCode Open Tabs
bob_session/bob_ide_task_reports/backend_scaffolding.md,bob_session/bob_ide_task_reports/cli_iterations.md,bob_session/bob_task_may-16-2026_12-37-12-am.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-17T11:29:44.103Z
User time zone: Asia/Jakarta, UTC+7:00

# Current Cost
$0.01

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

I'll analyze the sherlock-cli shell implementation and create a comprehensive review of error handling improvements for the slash-command dispatcher.

<attempt_completion>
<result>
# Sherlock CLI Shell - Error Handling Review

## Current Implementation Analysis

The slash-command dispatcher is implemented in `sherlock-cli/src/shell/commands.ts` with the main entry point being `dispatchCommand()` (lines 547-569). Here's my assessment:

## ✅ Strengths

1. **Basic try-catch wrapper** - The dispatcher has a top-level try-catch (lines 560-568)
2. **Graceful unknown command handling** - Returns "continue" for unknown commands instead of crashing
3. **Individual handler error handling** - Most handlers have try-catch blocks for API calls
4. **User-friendly error messages** - Uses `failure()` helper for consistent error display

## ⚠️ Critical Issues & Recommendations

### 1. **Incomplete Error Context in Dispatcher**
**Issue**: The top-level catch (line 565-567) loses error context and stack traces.

```typescript
// Current (line 565-567)
catch (err: any) {
  failure(`Command failed: ${err.message ?? err}`);
  return "continue";
}
```

**Recommendation**:
```typescript
catch (err: any) {
  const errorMsg = err.message ?? String(err);
  const errorStack = err.stack ? `\n${chalk.dim(err.stack)}` : '';
  failure(`Command failed: ${errorMsg}`);
  
  // Log full error in debug mode
  if (process.env.DEBUG || process.env.SHERLOCK_DEBUG) {
    console.error(chalk.dim('Full error:'), errorStack);
  }
  
  // Suggest recovery actions
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    info('Backend connection failed. Try /auth status or switch to mock mode.');
  }
  
  return "continue";
}
```

### 2. **Missing Input Validation**
**Issue**: No validation for command arguments before passing to handlers.

**Recommendation**: Add validation layer:
```typescript
function validateArgs(name: string, args: string[]): { valid: boolean; error?: string } {
  const validators: Record<string, (args: string[]) => boolean> = {
    switch: (args) => args.length > 0,
    open: (args) => args.length <= 1,
    fix: (args) => args.length <= 1,
    // Add more as needed
  };
  
  const validator = validators[name];
  if (validator && !validator(args)) {
    return { valid: false, error: `Invalid arguments for /${name}` };
  }
  return { valid: true };
}

// In dispatchCommand, before calling handler:
const validation = validateArgs(parsed.name, parsed.args);
if (!validation.valid) {
  warn(validation.error!);
  info(`Type ${chalk.cyan('/help')} for usage information.`);
  return "continue";
}
```

### 3. **Unhandled Promise Rejections in Handlers**
**Issue**: Several handlers (e.g., `resolveHandler`, `fixHandler`) have nested async operations without proper error boundaries.

**Example Issue** (lines 170-176):
```typescript
if (fs.existsSync(target)) {
  try {
    rawInput = fs.readFileSync(target, "utf-8");
  } catch (err: any) {
    failure(`Cannot read ${target}: ${err.message ?? err}`);
    return "continue";
  }
}
```

**Recommendation**: Add file validation:
```typescript
if (fs.existsSync(target)) {
  try {
    const stats = fs.statSync(target);
    if (!stats.isFile()) {
      failure(`${target} is not a file`);
      return "continue";
    }
    if (stats.size > 10 * 1024 * 1024) { // 10MB limit
      failure(`File too large: ${target} (max 10MB)`);
      return "continue";
    }
    rawInput = fs.readFileSync(target, "utf-8");
  } catch (err: any) {
    failure(`Cannot read ${target}: ${err.message ?? err}`);
    if (err.code === 'EACCES') {
      info('Permission denied. Check file permissions.');
    }
    return "continue";
  }
}
```

### 4. **No Timeout Protection**
**Issue**: API calls and pipeline operations can hang indefinitely.

**Recommendation**: Add timeout wrapper:
```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

// Usage in handlers:
try {
  state = await withTimeout(
    mock ? mockIncidentState(id) : getIncidentState(id),
    30000,
    'Fetch incident state'
  );
} catch (err: any) {
  failure(`Cannot fetch ${id}: ${err.message ?? err}`);
  if (err.message.includes('timed out')) {
    info('The backend may be slow. Try again or use /status to check connectivity.');
  }
  return "continue";
}
```

### 5. **Inconsistent Error Recovery Guidance**
**Issue**: Error messages don't consistently suggest recovery actions.

**Recommendation**: Create error classification system:
```typescript
enum ErrorCategory {
  AUTH = 'auth',
  NETWORK = 'network',
  INPUT = 'input',
  INTERNAL = 'internal',
}

function classifyError(err: any): ErrorCategory {
  if (err.message?.includes('Authentication') || err.code === 401) return ErrorCategory.AUTH;
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') return ErrorCategory.NETWORK;
  if (err.message?.includes('Invalid') || err.code === 400) return ErrorCategory.INPUT;
  return ErrorCategory.INTERNAL;
}

function suggestRecovery(category: ErrorCategory, context: string) {
  const suggestions: Record<ErrorCategory, string> = {
    [ErrorCategory.AUTH]: 'Run /auth login to authenticate',
    [ErrorCategory.NETWORK]: 'Check /auth status or try mock mode with SHERLOCK_MODE=mock',
    [ErrorCategory.INPUT]: 'Check your input and try again. Use /help for command syntax',
    [ErrorCategory.INTERNAL]: 'This may be a bug. Try /clear and retry, or report the issue',
  };
  info(suggestions[category]);
}
```

### 6. **Missing Graceful Degradation**
**Issue**: When backend fails, some commands crash instead of offering alternatives.

**Recommendation**: Add fallback chain:
```typescript
async function fetchWithFallback<T>(
  primary: () => Promise<T>,
  fallback: () => T,
  operation: string
): Promise<T> {
  try {
    return await primary();
  } catch (err: any) {
    warn(`${operation} failed: ${err.message}`);
    info('Using cached/mock data instead');
    return fallback();
  }
}
```

### 7. **No Rate Limiting or Retry Logic**
**Issue**: Rapid command execution could overwhelm the backend.

**Recommendation**: Add simple rate limiter:
```typescript
class CommandRateLimiter {
  private lastCall = 0;
  private minInterval = 500; // ms between commands
  
  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastCall = Date.now();
  }
}

const rateLimiter = new CommandRateLimiter();

// In dispatchCommand, before handler execution:
await rateLimiter.throttle();
```

## 📋 Priority Implementation Order

1. **High Priority**: Add timeout protection and better error context
2. **High Priority**: Implement input validation layer
3. **Medium Priority**: Add error classification and recovery suggestions
4. **Medium Priority**: Improve file handling with size/permission checks
5. **Low Priority**: Add rate limiting for production safety

## Summary

The current implementation has basic error handling but lacks robustness for production use. The main gaps are: missing timeouts, incomplete error context, no input validation, and inconsistent recovery guidance. Implementing these improvements will make the CLI more resilient and user-friendly.
</result>
</attempt_completion>

