# 🔍 Sherlock — AI Incident Response Co-pilot

> *"From alert to fix PR in 5 minutes — your AI on-call partner that actually reads the codebase."*

**Built for IBM Bob Hackathon 2026**

Sherlock adalah AI-powered incident response automation yang menggunakan **IBM Bob** sebagai core engine untuk code-level analysis. Sistem ini mengotomasi proses dari alert detection hingga fix generation dan postmortem documentation.

## 🎯 Problem Statement

Production incidents memakan waktu rata-rata **4.4 jam MTTR** untuk cycle: parse stack trace → find root cause → reproduce → fix → write postmortem. Sherlock mengurangi waktu ini menjadi **< 5 menit** dengan AI-powered multi-agent pipeline.

## ✨ Key Features

- 🧠 **IBM Bob Integration** - Full repository context untuk root cause analysis
- ⚡ **Multi-Agent Pipeline** - 5 specialized agents bekerja secara berurutan
- 🔄 **Real-time Streaming** - Live progress updates via Server-Sent Events
- 🛠️ **Automated Fix Generation** - Code patches dengan test cases
- 📝 **Auto Postmortem** - Comprehensive documentation generation
- 🎨 **Modern UI** - Next.js 14 dengan real-time agent visualization

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Sherlock System                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────────────────┐    │
│  │   Next.js    │  SSE    │      FastAPI             │    │
│  │   Frontend   │◄────────┤      Backend             │    │
│  │              │         │                          │    │
│  └──────────────┘         └────────┬─────────────────┘    │
│                                    │                       │
│                                    ▼                       │
│                    ┌───────────────────────────┐          │
│                    │  Pipeline Orchestrator    │          │
│                    └───────────┬───────────────┘          │
│                                │                           │
│                                ▼                           │
│        ┌───────────────────────────────────────┐          │
│        │      Multi-Agent Pipeline             │          │
│        ├───────────────────────────────────────┤          │
│        │  1. Triage Agent                      │          │
│        │  2. Forensics Agent                   │          │
│        │  3. Bob Analyst Agent ⭐              │          │
│        │  4. Fix Agent ⭐                      │          │
│        │  5. Postmortem Agent                  │          │
│        └───────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** - Backend runtime
- **Node.js 18+** - Frontend runtime
- **Git** - For forensics analysis
- **IBM Bob CLI** (optional) - For production mode

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Sherlock

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Running the Application

#### Option 1: Manual Start (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
python run.py
```

Backend akan berjalan di `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

#### Option 2: Using PowerShell Script

```powershell
# Windows
.\start-dev.ps1
```

### First Run

1. Open browser: `http://localhost:3000`
2. Click "Load sample alert" untuk demo data
3. Click "Start Analysis"
4. Watch real-time agent pipeline execution
5. View generated postmortem

## 📁 Project Structure

```
Sherlock/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── config.py          # Configuration
│   │   ├── bob_client.py      # IBM Bob CLI wrapper ⭐
│   │   ├── models/
│   │   │   └── state.py       # Pydantic models
│   │   ├── agents/            # Multi-agent system
│   │   │   ├── triage.py
│   │   │   ├── forensics.py
│   │   │   ├── bob_analyst.py ⭐
│   │   │   ├── fix.py         ⭐
│   │   │   └── postmortem.py
│   │   ├── orchestrator/
│   │   │   └── pipeline.py    # Agent orchestration
│   │   └── api/
│   │       └── incidents.py   # API routes
│   ├── requirements.txt
│   ├── run.py
│   └── README.md
│
├── frontend/                   # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── incidents/
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Analysis page
│   │   └── globals.css
│   ├── components/
│   │   └── AgentCard.tsx      # Agent status card
│   ├── package.json
│   └── README.md
│
├── fixtures/                   # Sample data
│   ├── alerts/
│   │   └── alert_race_condition.json
│   ├── bob_responses/
│   │   ├── root_cause_analysis.json
│   │   └── fix_proposal.json
│   └── flaky-shop/            # Sample buggy repo
│       └── src/cart/checkout.ts
│
├── README.md                   # This file
└── SHERLOCK_IMPLEMENTATION_PLAN.md
```

## 🤖 Multi-Agent Pipeline

### 1. Triage Agent
**Purpose:** Classify incident severity and error type

**Output:**
- Severity: LOW | MEDIUM | HIGH | CRITICAL
- Error type: null_pointer | race_condition | timeout | etc
- Service identification
- Confidence score

### 2. Forensics Agent
**Purpose:** Gather git history and code context

**Output:**
- Recent commits (last 20)
- Git blame information
- Suspect files identification
- Log excerpts

### 3. Bob Analyst Agent ⭐
**Purpose:** Root cause analysis dengan IBM Bob

**Output:**
- Root cause hypothesis
- Suspect files dengan line numbers
- Reasoning chain
- Confidence score

**IBM Bob Integration:**
```python
result = await ask_bob(
    prompt=analysis_prompt,
    repo_path=repo_path,
    output_schema=RootCauseAnalysis
)
```

### 4. Fix Agent ⭐
**Purpose:** Generate code patch menggunakan IBM Bob

**Output:**
- Unified diff patch
- Test code
- PR title & description
- Files modified list

### 5. Postmortem Agent
**Purpose:** Generate comprehensive documentation

**Output:**
- Executive summary
- Timeline
- Root cause analysis
- Resolution steps
- Action items
- Lessons learned

## 🔧 Configuration

### Backend Configuration

Create `backend/.env`:
```bash
# Bob CLI Settings
SHERLOCK_BOB_MOCK_MODE=true          # Enable mock mode
SHERLOCK_BOB_CLI_PATH=bob
SHERLOCK_BOB_TIMEOUT=60

# API Settings
SHERLOCK_CORS_ORIGINS=["http://localhost:3000"]
SHERLOCK_LOG_LEVEL=INFO

# Repository Settings
SHERLOCK_FIXTURES_PATH=../fixtures
SHERLOCK_SAMPLE_REPO_PATH=../fixtures/flaky-shop
```

### Frontend Configuration

Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test
pytest tests/agents/test_triage.py
```

### Frontend Tests

```bash
cd frontend

# Run linter
npm run lint

# Build check
npm run build
```

## 📊 Demo Scenario

### Sample Bug: Race Condition in Checkout

**Scenario:** E-commerce checkout service experiencing `TypeError: Cannot read property 'quantity' of undefined`

**Root Cause:** Missing `await` on async inventory fetch

**Sherlock Analysis:**
1. **Triage** (5s) - Identifies HIGH severity, null_pointer error
2. **Forensics** (10s) - Finds recent commits in checkout.ts
3. **Bob Analysis** (30s) - Identifies missing await, explains race condition
4. **Fix Generation** (45s) - Generates patch with await + test case
5. **Postmortem** (10s) - Creates comprehensive documentation

**Total Time:** ~2 minutes vs. 4+ hours manual debugging

## 🎯 IBM Bob Integration

### Why Bob is Central

1. **Full Repository Context** - Bob understands entire codebase
2. **Code-Level Reasoning** - Not just log analysis, actual code understanding
3. **Fix Generation** - Produces production-ready patches
4. **Structured Output** - JSON responses untuk automation

### Bob Usage Points

- **Root Cause Analysis** - `bob_analyst.py`
- **Fix Generation** - `fix.py`
- **Code Explanation** - Throughout pipeline

### Mock Mode

Untuk development tanpa Bob quota:
```bash
export SHERLOCK_BOB_MOCK_MODE=true
```

Mock responses dari `fixtures/bob_responses/`

## 📈 Success Metrics

- ✅ **MTTR Reduction:** 4.4 hours → 5 minutes (98% reduction)
- ✅ **Automation Rate:** 5/5 agents automated
- ✅ **Code Context:** Full repository analysis
- ✅ **Documentation:** Auto-generated postmortems
- ✅ **Developer Experience:** Real-time progress visibility

## 🚧 Known Limitations

- Requires git repository with history
- Bob CLI quota limits (use mock mode for development)
- Single incident processing (no parallel analysis yet)
- English-only postmortem generation

## 🔮 Future Enhancements

- [ ] Multi-incident dashboard
- [ ] Slack/PagerDuty integration
- [ ] Auto-create GitHub PRs
- [ ] Historical incident analysis
- [ ] Team collaboration features
- [ ] Custom agent plugins
- [ ] Multi-language support

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Write tests
4. Submit pull request

## 📄 License

MIT License - IBM Bob Hackathon 2026

## 🙏 Acknowledgments

- **IBM Bob Team** - For the amazing AI dev partner
- **Hackathon Organizers** - For the opportunity
- **Open Source Community** - For the tools and libraries

---

## 📞 Support

- **Documentation:** See `backend/README.md` and `frontend/README.md`
- **Issues:** GitHub Issues
- **Demo Video:** [Link to demo]

---

**Built with ❤️ for IBM Bob Hackathon 2026**

*Sherlock - Because production incidents shouldn't take 4 hours to debug*

🔍 **Powered by IBM Bob**
