# Sherlock CLI

> Interactive incident-response shell for the Sherlock AI co-pilot.
> Powered by IBM Bob repository intelligence.

```
╔════════════════════════════════════════════════════════╗
║ Sherlock Incident Response Shell                       ║
║ Powered by IBM Bob repository intelligence             ║
╚════════════════════════════════════════════════════════╝

Connected to local backend (http://localhost:8000)
Workspace      production
Authenticated  yes

Type /help for available commands

sherlock ›
```

The CLI is the on-call surface of Sherlock. Paste an alert, type `/resolve`,
and watch a five-agent pipeline (triage → forensics → analyst → fix →
postmortem) reason through your repository and produce a fix PR + postmortem.

---

## Quick start

```bash
npm install -g @bagusardin25/sherlock-cli
sherlock-cli
```

First login:

```bash
sherlock-cli auth login
```

This opens the Sherlock web login. Create an API key in Settings > API Keys,
then paste the key back into the CLI. The `sherlock` alias is also available.

### Mock mode (no backend needed)

```bash
SHERLOCK_MOCK=true sherlock-cli
```

Mock mode runs a deterministic ~24-second pipeline with realistic pacing,
varied confidence scores, and a sample fix patch. Ideal for demos.

---

## Interactive shell

Run `sherlock-cli` with no arguments. The shell shows a session header with
your workspace, auth state, and connection mode, then drops you at the
`sherlock ›` prompt.

After `/resolve` succeeds, the prompt switches to:

```
sherlock(inc-6x2rxd) ›
```

…and `/fix`, `/postmortem`, and `/open` automatically use that incident.
No need to retype the ID.

### Slash commands

| Command | Description |
| --- | --- |
| `/resolve <file>` | Run the full incident pipeline on an alert file or raw text |
| `/status [id]` | List recorded incidents, or show full detail for one |
| `/fix [id]` | Show the generated patch, files modified, regression test status |
| `/postmortem [id]` | Render the incident report (markdown) |
| `/open [id]` | Open the incident in the web dashboard (default browser) |
| `/history` | Recent incidents resolved in this session |
| `/auth login` | Open web login and save an API key |
| `/auth status` | Show current auth state and endpoint |
| `/auth logout` | Remove stored credentials |
| `/clear` | Clear the screen |
| `/help` | Show the slash command reference |
| `/exit` | Leave the shell (also `Ctrl+D`) |

### Demo flow (3 minutes)

```
sherlock ›  /resolve fixtures/alerts/alert_race_condition.json

[TRIAGE] Critical severity detected
    TypeError on async inventory access during checkout
  Severity      HIGH
  Service       checkout-service
  Error type    race_condition
  Confidence: 95%

[FORENSICS] Suspicious commit detected
  Evidence:
    • 12 commits within incident time window
    • checkout.ts modified 3 days before first occurrence
    • no corresponding test changes in the same PR
  Suspect commit  8f3ab21 — refactor async payment validation (alice)

[ANALYST] Root cause identified
  Hypothesis:
    Race condition introduced during async checkout refactor — inventory
    fetch is not awaited before decrement, returning a Promise instead of
    inventory data.
  Evidence:
    • stack trace correlation: TypeError on undefined.quantity
    • commit timeline analysis: 8f3ab21 removed `await` keyword
    • dependency graph: getInventory() returns Promise<Inventory>
    • no failing test guards this async boundary
  Confidence: 87%

[FIX] Patch generated
  PR title  fix: await inventory fetch in checkout flow
  Files     src/cart/checkout.ts, src/cart/checkout.test.ts
  Tests     regression test included
  Patch:
    @@ -39,7 +39,7 @@
    -  const inventory = getInventory(productId);
    +  const inventory = await getInventory(productId);

[POSTMORTEM] Incident report completed

✓ Investigation complete · incident inc-6x2rxd · 24.1s
  Root cause in 4.5s · patch in 3.8s

Active incident: inc-6x2rxd
Next: /fix · /postmortem

sherlock(inc-6x2rxd) ›  /open
Opening inc-6x2rxd in dashboard…
https://sherlockai-ibm.vercel.app/incidents/inc-6x2rxd
✓ Launched.
```

---

## One-shot mode

Useful in CI/CD pipelines or scripts:

```bash
sherlock resolve crash.log --repo https://github.com/org/service
sherlock status                       # list
sherlock status inc-a1b2c3d4          # detail
sherlock fix inc-a1b2c3d4 --output fix.patch
sherlock postmortem inc-a1b2c3d4 --output incident.md
sherlock auth login
```

Every one-shot command uses the same renderer as the interactive shell, so
output is consistent regardless of how it is invoked.

---

## Authentication

Credentials live in `~/.sherlock/config.json`. Get an API key from the
dashboard (Settings → API Keys), then:

```bash
sherlock auth login
# or, inside the shell:
sherlock ›  /auth login
```

Keys are masked in display:

```
Sherlock CLI · Auth Status
──────────────────────────

✓ Authenticated
Key       sk_sherlock_••••••••••••••••••••••••••••••••
Endpoint  http://localhost:8000
Config    ~/.sherlock/config.json
Status    Connected to local backend (http://localhost:8000)
```

---

## Configuration

| Environment variable | Purpose | Default |
| --- | --- | --- |
| `SHERLOCK_API_URL` | Backend URL | `http://localhost:8000` |
| `SHERLOCK_API_KEY` | Auth key (overrides config file) | — |
| `SHERLOCK_MOCK` | `true` to force mock mode | `false` |
| `SHERLOCK_DASHBOARD_URL` | URL `/open` launches | `https://sherlockai-ibm.vercel.app` |
| `SHERLOCK_WORKSPACE` | Label shown in session header | `production` |

The CLI also accepts `--mock` on the command line for one-shot calls.

---

## Architecture

```
src/
├── index.ts                # Entry point: shell when no args, Commander otherwise
├── commands/               # Commander wrappers (one-shot mode)
│   ├── auth.ts             # Login/status/logout + reusable helpers
│   ├── investigate.ts      # `sherlock resolve <file>`
│   ├── status.ts
│   ├── fix.ts
│   └── postmortem.ts
├── shell/                  # Interactive shell
│   ├── repl.ts             # readline loop, banner, dynamic prompt
│   ├── session.ts          # workspace, mode, active incident, history
│   ├── commands.ts         # Slash command dispatcher
│   ├── pipeline.ts         # Reusable streaming runner (mock or SSE)
│   ├── render.ts           # [AGENT] tags, hypothesis/evidence renderer
│   └── views.ts            # Shared incident list/detail/fix/postmortem views
├── services/
│   ├── api.ts              # Backend HTTP client
│   ├── mock.ts             # Deterministic pipeline for offline demos
│   └── client.ts           # Mock-vs-backend resolver
└── utils/
    └── opener.ts           # Cross-platform browser launcher
```

The same `runResolvePipeline` and `view*` functions back both the shell and
the one-shot commands — visual output is identical.

---

## Design principles

- **Banner only for cinematic surfaces**: bare `sherlock`, `sherlock --help`,
  `sherlock resolve`. Auth and admin commands stay clean.
- **Slash commands inside the shell**: `/resolve`, `/fix`, `/auth login` —
  AI-native UX, similar to Claude Code, Codex, or Gemini CLI.
- **Persistent session context**: active incident travels with the prompt;
  `/fix` and `/open` use it automatically.
- **One renderer, two modes**: shell and one-shot share `views.ts` so
  output is consistent for both demos and automation.
- **Reasoning over noise**: `[AGENT]` tags, then Hypothesis / Evidence /
  Confidence — no boxy panels, no emoji clutter.

---

## License

MIT — built for the IBM Bob Hackathon 2026.
