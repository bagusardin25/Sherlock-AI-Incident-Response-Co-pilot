# 🔍 Sherlock — AI Incident Response Co-pilot

> *From alert to fix PR — your AI on-call partner that actually reads the codebase.*

**Built for IBM Bob Hackathon 2026**

Sherlock is an AI-powered incident-response system that uses **IBM Bob** as
its core engine for code-level reasoning. It automates the on-call cycle:
parse the alert, understand the repo, propose a fix, write the postmortem.

It ships in three surfaces:

- 🖥️ **CLI shell** (`sherlock-cli`) — the on-call surface. Cinematic,
  slash-command driven, demo-able in 3 minutes.
- 🌐 **Web UI** (`frontend`) — Next.js dashboard with real-time agent
  visualization.
- ⚙️ **Backend** (`backend`) — FastAPI orchestrator + multi-agent pipeline
  + IBM Bob API client.

---

## 🎯 The problem

Production incidents take an average of **4.4 hours MTTR**: parse stack
trace → find root cause → reproduce → fix → write postmortem. Existing
tooling summarizes logs but cannot reason about your codebase.

Sherlock collapses that cycle by giving Bob full repo context and orchestrating
five specialized agents on top of it.

---

## ✨ The headline demo: the CLI shell

```
$ sherlock

╔════════════════════════════════════════════════════════╗
║ Sherlock Incident Response Shell                       ║
║ Powered by IBM Bob repository intelligence             ║
╚════════════════════════════════════════════════════════╝

Connected to local backend (http://localhost:8000)
Workspace      production
Authenticated  yes

Type /help for available commands

sherlock ›  /resolve fixtures/alerts/alert_race_condition.json

[TRIAGE] Critical severity detected
  Severity      HIGH
  Service       checkout-service
  Confidence: 95%

[FORENSICS] Suspicious commit detected
  Suspect commit  8f3ab21 — refactor async payment validation (alice)

[ANALYST] Root cause identified
  Hypothesis:
    Race condition introduced during async checkout refactor — inventory
    fetch is not awaited before decrement.
  Evidence:
    • stack trace correlation: TypeError on undefined.quantity
    • commit timeline analysis: 8f3ab21 removed `await` keyword
    • dependency graph: getInventory() returns Promise<Inventory>
  Confidence: 87%

[FIX] Patch generated
  PR title  fix: await inventory fetch in checkout flow
  Patch:
    -  const inventory = getInventory(productId);
    +  const inventory = await getInventory(productId);

[POSTMORTEM] Incident report completed

✓ Investigation complete · incident inc-6x2rxd · 24.1s

sherlock(inc-6x2rxd) ›  /fix          # uses the active incident
sherlock(inc-6x2rxd) ›  /postmortem
sherlock(inc-6x2rxd) ›  /open         # opens dashboard in your browser
```

The shell is **AI-native, conversational, and stateful**. Active incidents
follow you across commands. See [`sherlock-cli/README.md`](sherlock-cli/README.md)
for the full spec.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Sherlock                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐   ┌───────────┐                              │
│  │ CLI Shell│   │ Next.js   │                              │
│  │ (Node)   │   │ Web UI    │                              │
│  └────┬─────┘   └─────┬─────┘                              │
│       │               │                                     │
│       └───────┬───────┘  REST + SSE                        │
│               │                                             │
│               ▼                                             │
│        ┌──────────────┐                                    │
│        │   FastAPI    │                                    │
│        │   Backend    │                                    │
│        └──────┬───────┘                                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                   │
│  │   Multi-Agent Pipeline             │                   │
│  │   1. Triage                        │                   │
│  │   2. Forensics                     │                   │
│  │   3. Bob Analyst   ⭐              │                   │
│  │   4. Fix           ⭐              │                   │
│  │   5. Postmortem                    │                   │
│  └────────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The **Analyst** and **Fix** agents are where IBM Bob earns its keep:
full-repo reasoning rather than log summarization.

---

## 🚀 Quick start

### Requirements

- Python 3.11+
- Node.js 18+
- Git
- IBM Bob API key *(optional — mock mode works without it)*

### Install

```bash
git clone <repo-url> Sherlock
cd Sherlock

# Backend
cd backend && pip install -r requirements.txt && cd ..

# Frontend
cd frontend && npm install && cd ..

# CLI
cd sherlock-cli && npm install && npm run build && cd ..
```

### Run all three

**Terminal 1 — backend**

```bash
cd backend
python run.py                # http://localhost:8000
```

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev                  # http://localhost:3000
```

**Terminal 3 — CLI**

```bash
cd sherlock-cli
node dist/index.js           # or `npm link` then `sherlock`
```

### Mock mode (no backend, no Bob)

```bash
SHERLOCK_MOCK=true sherlock
```

Runs a deterministic ~24s pipeline. Use this for the demo if Bob quota is a
concern.

---

## 📁 Project structure

```
Sherlock/
├── sherlock-cli/             # Interactive CLI shell + slash commands
│   ├── src/
│   │   ├── shell/            # REPL, dispatcher, render, views, pipeline
│   │   ├── commands/         # Commander one-shot wrappers
│   │   └── services/         # Backend client, mock pipeline
│   └── README.md             # ← Full CLI spec & demo
│
├── frontend/                 # Next.js 14 dashboard
│   ├── app/                  # Pages (incidents, settings, auth)
│   └── components/           # AgentCard etc.
│
├── backend/                  # FastAPI + multi-agent pipeline
│   ├── app/
│   │   ├── agents/           # triage / forensics / bob_analyst / fix / postmortem
│   │   ├── orchestrator/     # Pipeline state machine
│   │   ├── api/              # REST + SSE
│   │   ├── auth/             # JWT, API keys
│   │   ├── models/           # Pydantic + SQLAlchemy
│   │   ├── bob_client.py     # IBM Bob API client ⭐
│   │   └── database.py       # PostgreSQL via SQLAlchemy
│   ├── alembic/              # Schema migrations
│   └── README.md
│
├── fixtures/
│   ├── alerts/               # Sample alert payloads
│   ├── bob_responses/        # Canned Bob responses for mock mode
│   └── flaky-shop/           # Sample buggy repo (race condition)
│
└── README.md                 # ← This file
```

---

## 🤖 The agents

| # | Agent | Purpose | IBM Bob? |
|---|---|---|---|
| 1 | **Triage** | Classify severity, error type, service | No |
| 2 | **Forensics** | Pull git history, identify suspect commits/files | No |
| 3 | **Analyst** ⭐ | Reason over the repo to identify root cause | **Yes** |
| 4 | **Fix** ⭐ | Generate unified-diff patch + regression test | **Yes** |
| 5 | **Postmortem** | Aggregate findings into a publishable report | Optional |

---

## 🔧 Configuration

### Backend (`backend/.env`)

```bash
# IBM Bob — the core reasoning engine
SHERLOCK_BOB_API_KEY=your-ibm-bob-api-key
SHERLOCK_BOB_API_URL=https://api.ibm-bob.ai/v1/chat/completions
SHERLOCK_BOB_MODEL=bob-v1
SHERLOCK_BOB_MOCK_MODE=true          # set false when you have a real key
SHERLOCK_BOB_TIMEOUT=120

SHERLOCK_DATABASE_URL=postgresql://user:pass@localhost/sherlock
SHERLOCK_CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### CLI (`~/.sherlock/config.json`, or env vars)

```bash
SHERLOCK_API_URL=http://localhost:8000
SHERLOCK_API_KEY=sk_sherlock_xxxx
SHERLOCK_DASHBOARD_URL=http://localhost:3000
SHERLOCK_MOCK=true       # for demos
```

---

## 📊 What success looks like

- **MTTR**: 4.4 hours → ~25 seconds (mock pipeline) / ~3 minutes (real Bob)
- **Surfaces**: CLI, Web, and CI/CD-friendly one-shot commands
- **Bob role**: code-level reasoning at the analyst and fix steps —
  the differentiator vs. log-summary tools

---

## 🚧 Known limitations

- Requires a git repository with history for forensics to be useful.
- Bob CLI quota is finite — the CLI ships with a `SHERLOCK_MOCK=true` fallback.
- Postmortem prose is English-only.
- Single incident at a time (no parallel pipelines yet).

---

## 📞 Links

- **CLI README**: [`sherlock-cli/README.md`](sherlock-cli/README.md)
- **Backend README**: [`backend/README.md`](backend/README.md)
- **Frontend README**: [`frontend/README.md`](frontend/README.md)
- **Implementation plan**: [`SHERLOCK_IMPLEMENTATION_PLAN.md`](SHERLOCK_IMPLEMENTATION_PLAN.md)
- **GitHub**: https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot

---

**Built with IBM Bob for the IBM Bob Hackathon 2026.**
*Sherlock — because production incidents shouldn't take 4 hours to debug.*
