# Sherlock Backend - AI Incident Response Co-pilot

Backend system untuk Sherlock, AI-powered incident response automation menggunakan IBM Bob untuk code-level analysis.

## 🏗️ Architecture

```
┌─────────────┐
│   FastAPI   │
│   Gateway   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Pipeline Orchestrator (LangGraph) │
└──────┬──────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│              Multi-Agent Pipeline                │
├──────────────────────────────────────────────────┤
│  1. Triage Agent      → Classify severity       │
│  2. Forensics Agent   → Git history analysis    │
│  3. Bob Agent ⭐      → Root cause (IBM Bob)    │
│  4. Fix Agent         → Code patch (IBM Bob)    │
│  5. Postmortem Agent  → Documentation           │
└──────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Git
- IBM Bob CLI (untuk production mode)

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables (optional)
cp .env.example .env
# Edit .env untuk konfigurasi
```

### Running the Server

```bash
# Development mode dengan auto-reload
python -m uvicorn app.main:app --reload --port 8000

# Atau menggunakan Python directly
python app/main.py
```

Server akan berjalan di `http://localhost:8000`

### API Documentation

Setelah server berjalan, akses:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── bob_client.py        # IBM Bob CLI wrapper ⭐
│   │
│   ├── models/
│   │   └── state.py         # Pydantic models untuk state
│   │
│   ├── agents/              # Multi-agent system
│   │   ├── triage.py        # Severity classification
│   │   ├── forensics.py     # Git history analysis
│   │   ├── bob_analyst.py   # Root cause analysis (Bob) ⭐
│   │   ├── fix.py           # Fix generation (Bob) ⭐
│   │   └── postmortem.py    # Documentation generation
│   │
│   ├── orchestrator/
│   │   └── pipeline.py      # Agent orchestration
│   │
│   └── api/
│       └── incidents.py     # API routes
│
├── tests/                   # Test suite
│   ├── agents/
│   └── fixtures_test.py
│
└── requirements.txt         # Python dependencies
```

## 🔧 Configuration

### Environment Variables

```bash
# Bob CLI Settings
SHERLOCK_BOB_MOCK_MODE=true          # Enable mock mode untuk testing
SHERLOCK_BOB_CLI_PATH=bob            # Path ke Bob CLI
SHERLOCK_BOB_TIMEOUT=60              # Timeout dalam detik

# API Settings
SHERLOCK_CORS_ORIGINS=["http://localhost:3000"]
SHERLOCK_LOG_LEVEL=INFO

# Repository Settings
SHERLOCK_FIXTURES_PATH=./fixtures
SHERLOCK_SAMPLE_REPO_PATH=./fixtures/flaky-shop
```

### Mock Mode

Untuk development tanpa Bob CLI quota:

```bash
export SHERLOCK_BOB_MOCK_MODE=true
```

Mock responses akan diambil dari `fixtures/bob_responses/`

## 🎯 API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "sherlock-api",
  "version": "1.0.0",
  "bob_mock_mode": true
}
```

### Submit Incident

```bash
POST /api/incidents/
Content-Type: application/json

{
  "raw_input": "TypeError: Cannot read property 'quantity' of undefined...",
  "repo_path": "/path/to/repo",
  "incident_id": "inc-12345"  // optional
}
```

Response:
```json
{
  "incident_id": "inc-12345",
  "status": "processing",
  "message": "Incident analysis started",
  "stream_url": "/api/incidents/inc-12345/stream"
}
```

### Stream Analysis Progress (SSE)

```bash
GET /api/incidents/{incident_id}/stream?raw_input=...&repo_path=...
```

Returns Server-Sent Events stream:
```
data: {"agent_name":"triage","status":"running","message":"Analyzing..."}

data: {"agent_name":"triage","status":"completed","message":"Triage completed"}

data: {"agent_name":"bob_analyst","status":"running","message":"Bob analyzing..."}

...
```

### Get Incident State

```bash
GET /api/incidents/{incident_id}/state
```

### Get Postmortem

```bash
GET /api/incidents/{incident_id}/postmortem
```

## 🤖 Agent Details

### 1. Triage Agent

**Purpose:** Classify incident severity dan error type

**Input:** Raw alert text

**Output:**
- Severity: LOW | MEDIUM | HIGH | CRITICAL
- Error type: null_pointer | race_condition | timeout | etc
- Service name
- Summary
- Confidence score

**Implementation:** Pattern matching + heuristics (no LLM call)

### 2. Forensics Agent

**Purpose:** Gather git history dan code context

**Input:** Triage result

**Output:**
- Recent commits (last 20)
- Git blame info untuk suspect files
- Log excerpts

**Implementation:** Git CLI commands (git log, git blame)

### 3. Bob Analyst Agent ⭐

**Purpose:** Root cause analysis dengan full repo context

**Input:** Triage + Forensics results

**Output:**
- Root cause hypothesis
- Suspect files dengan line numbers
- Reasoning chain
- Confidence score

**Implementation:** Calls IBM Bob CLI dengan structured prompt

**Bob Integration:**
```python
result = await ask_bob(
    prompt=analysis_prompt,
    repo_path=repo_path,
    output_schema=RootCauseAnalysis,
    correlation_id=incident_id
)
```

### 4. Fix Agent ⭐

**Purpose:** Generate code patch dan tests

**Input:** All previous agent results

**Output:**
- Unified diff patch
- Test code
- PR title & body
- Files modified list

**Implementation:** Calls IBM Bob CLI untuk code generation

### 5. Postmortem Agent

**Purpose:** Generate comprehensive postmortem document

**Input:** Complete incident state

**Output:** Markdown postmortem dengan:
- Executive summary
- Timeline
- Root cause analysis
- Resolution steps
- Action items
- Lessons learned

**Implementation:** Jinja2 template rendering

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pytest

# Run dengan coverage
pytest --cov=app

# Run specific test file
pytest tests/agents/test_triage.py

# Run dengan Bob mock mode
BOB_MOCK=1 pytest
```

### Test Structure

```
tests/
├── agents/
│   ├── test_triage.py
│   ├── test_forensics.py
│   ├── test_bob_analyst.py
│   ├── test_fix.py
│   └── test_postmortem.py
├── test_bob_client.py
├── test_pipeline.py
└── fixtures_test.py
```

## 🔍 IBM Bob Integration

### Bob CLI Wrapper

File: `app/bob_client.py`

**Features:**
- Async subprocess execution
- Structured I/O dengan Pydantic validation
- Timeout handling
- Retry logic untuk parse failures
- Mock mode untuk testing
- Correlation ID tracking

**Usage:**

```python
from app.bob_client import ask_bob
from app.models.state import RootCauseAnalysis

result = await ask_bob(
    prompt="Analyze this bug...",
    repo_path="/path/to/repo",
    output_schema=RootCauseAnalysis,
    correlation_id="inc-123"
)
```

### Mock Responses

Location: `fixtures/bob_responses/`

Files:
- `root_cause_analysis.json` - Mock root cause analysis
- `fix_proposal.json` - Mock fix proposal

Enable mock mode:
```bash
export SHERLOCK_BOB_MOCK_MODE=true
```

## 📊 Sample Data

### Alert Fixtures

Location: `fixtures/alerts/`

Example: `alert_race_condition.json`
```json
{
  "alert_id": "SENTRY-2024-001",
  "severity": "high",
  "service": "checkout-service",
  "error": {
    "type": "TypeError",
    "message": "Cannot read property 'quantity' of undefined",
    "stack_trace": [...]
  }
}
```

### Sample Repository

Location: `fixtures/flaky-shop/`

Buggy e-commerce app dengan intentional bugs:
- Race condition di checkout flow
- Missing await pada async operations

## 🚦 Development Workflow

### 1. Start Backend

```bash
cd backend
python app/main.py
```

### 2. Test dengan cURL

```bash
# Health check
curl http://localhost:8000/health

# Submit incident (dengan mock mode)
curl -X POST http://localhost:8000/api/incidents/ \
  -H "Content-Type: application/json" \
  -d '{
    "raw_input": "TypeError: Cannot read property quantity of undefined",
    "repo_path": "../fixtures/flaky-shop"
  }'

# Stream analysis (SSE)
curl -N "http://localhost:8000/api/incidents/inc-abc123/stream?raw_input=...&repo_path=..."
```

### 3. Monitor Logs

Logs akan menampilkan:
- Agent execution progress
- Bob CLI calls
- Errors dan warnings

## 🐛 Troubleshooting

### Bob CLI Not Found

```bash
# Check Bob CLI path
which bob

# Set custom path
export SHERLOCK_BOB_CLI_PATH=/path/to/bob
```

### Bob Timeout

```bash
# Increase timeout
export SHERLOCK_BOB_TIMEOUT=120
```

### Git Commands Failing

Pastikan repository path valid dan memiliki git history:
```bash
cd fixtures/flaky-shop
git init
git add .
git commit -m "Initial commit"
```

## 📝 Next Steps

### Immediate (MVP)

- [ ] Add comprehensive tests untuk semua agents
- [ ] Integration tests untuk full pipeline
- [ ] Error handling improvements
- [ ] Logging enhancements

### Future Enhancements

- [ ] Database persistence untuk incident history
- [ ] Webhook notifications (Slack, PagerDuty)
- [ ] Multi-repo support
- [ ] Real-time collaboration features
- [ ] Metrics dan analytics dashboard

## 🤝 Contributing

1. Create feature branch
2. Write tests
3. Implement feature
4. Run tests: `pytest`
5. Submit PR

## 📄 License

MIT License - IBM Bob Hackathon 2026

---

**Built with ❤️ for IBM Bob Hackathon**

*Sherlock - From alert to fix PR in 5 minutes*
