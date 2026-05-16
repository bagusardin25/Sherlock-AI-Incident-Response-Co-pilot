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

Connected to local backend
Workspace      production
Authenticated  yes

Type / for command palette

sherlock › /resolve

  Step 1 · Incident Input
  Paste a stack trace, provide a log file path, or use a sample alert.
  Sample: fixtures/alerts/alert_race_condition.json

? Alert file or error text: fixtures/alerts/alert_race_condition.json

  Step 2 · Target Repository
  Default: https://github.com/bagusardin25/flaky-shop

? Repository URL (Enter for default): ↵

[TRIAGE] Critical severity detected (2.0s)
  Severity      HIGH
  Service       checkout-service
  Confidence: 95%

[FORENSICS] Suspicious commit detected (2.6s)
  Suspect commit  8f3ab21 — refactor async payment validation (alice)

[ANALYST] Root cause identified (4.5s)
  Hypothesis:
    Race condition introduced during async checkout refactor — inventory
    fetch is not awaited before decrement.
  Evidence:
    • stack trace correlation: TypeError on undefined.quantity
    • commit timeline analysis: 8f3ab21 removed `await` keyword
    • dependency graph: getInventory() returns Promise<Inventory>
  Confidence: 92%

[FIX] Patch generated (3.8s)
  PR title  fix: await inventory fetch in checkout flow
  Patch:
    -  const inventory = getInventory(productId);
    +  const inventory = await getInventory(productId);

[POSTMORTEM] Incident report completed (2.6s)

✓ Investigation complete · incident inc-22b89bd2 · 11.8s
  Root cause in 4.5s · patch in 3.8s

sherlock(inc-22b89bd2) › /fix          # review generated patch
sherlock(inc-22b89bd2) › /postmortem   # full incident report
sherlock(inc-22b89bd2) › /open         # opens dashboard in your browser
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
- PostgreSQL 14+
- Git
- IBM Bob API key *(provided at hackathon start — mock mode works without it)*
- OpenRouter API key *(for triage, forensics, and postmortem agents)*

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
│   │   ├── services/         # Backend client, mock pipeline
│   │   └── utils/            # Browser opener
│   └── README.md             # ← Full CLI spec & demo
│
├── frontend/                 # Next.js 14 dashboard
│   ├── app/                  # Pages (landing, auth, incidents, scanner, settings, docs)
│   └── components/           # AgentCard, theme, layout
│
├── backend/                  # FastAPI + multi-agent pipeline
│   ├── app/
│   │   ├── agents/           # triage / forensics / bob_analyst / fix / postmortem
│   │   ├── orchestrator/     # Pipeline state machine (background task + DB save)
│   │   ├── api/              # REST + SSE streaming
│   │   ├── auth/             # JWT, API keys, Google OAuth
│   │   ├── models/           # Pydantic + SQLAlchemy
│   │   ├── services/         # Incident CRUD, repo manager
│   │   ├── bob_client.py     # IBM Bob API client ⭐
│   │   ├── openrouter_client.py  # OpenRouter API client
│   │   └── database.py       # PostgreSQL via async SQLAlchemy
│   ├── alembic/              # Schema migrations
│   └── README.md
│
├── fixtures/
│   ├── alerts/               # Sample alert payloads
│   ├── bob_responses/        # Canned Bob responses for mock mode
│   └── flaky-shop/           # Sample buggy repo (race condition)
│
├── design-system/            # Design tokens and style guides
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

# OpenRouter — used by triage, forensics, and postmortem agents
SHERLOCK_OPENROUTER_API_KEY=sk-or-v1-xxxx
SHERLOCK_OPENROUTER_MODEL=openai/gpt-4o-mini

# Database
SHERLOCK_DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/sherlock_db

# Auth
SHERLOCK_SECRET_KEY=your-jwt-secret
SHERLOCK_CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### CLI (`sherlock-cli/.env` or `~/.sherlock/config.json`)

```bash
# .env file (auto-loaded via dotenv)
SHERLOCK_API_URL=http://localhost:8000
SHERLOCK_API_KEY=sk_sherlock_xxxx     # from Dashboard → Settings → API Keys
SHERLOCK_DASHBOARD_URL=http://localhost:3000
SHERLOCK_MOCK=true                    # for demos without backend
```

The CLI also supports interactive authentication via `/auth login`.

---

## 📊 What success looks like

- **MTTR**: 4.4 hours → **~12 seconds** (real backend) / ~24s (mock pipeline)
- **Surfaces**: CLI, Web, and CI/CD-friendly one-shot commands (`sherlock resolve crash.log --output results.json`)
- **Bob role**: code-level reasoning at the analyst and fix steps —
  the differentiator vs. log-summary tools
- **Resilience**: pipeline runs in background — results always saved to DB even if client disconnects

---

## 🚧 Known limitations

- Requires a git repository with history for forensics to be useful.
- Bob API quota is finite — the CLI auto-falls back to mock mode when backend is unreachable.
- Postmortem prose is English-only.
- Single incident at a time per user (no parallel pipelines yet).
- CLI auto-detects backend availability every 30s (configurable TTL cache).

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
