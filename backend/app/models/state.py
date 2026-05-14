"""
Pydantic models untuk state management di Sherlock pipeline.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class Severity(str, Enum):
    """Severity levels untuk incident"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorType(str, Enum):
    """Tipe error yang umum"""
    NULL_POINTER = "null_pointer"
    RACE_CONDITION = "race_condition"
    TIMEOUT = "timeout"
    MEMORY_LEAK = "memory_leak"
    LOGIC_ERROR = "logic_error"
    UNKNOWN = "unknown"


class AgentStatus(str, Enum):
    """Status eksekusi agent"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TriageResult(BaseModel):
    """Output dari Triage Agent"""
    severity: Severity
    service: str
    error_type: ErrorType
    summary: str
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class CommitInfo(BaseModel):
    """Info tentang git commit"""
    hash: str
    author: str
    date: datetime
    message: str
    files_changed: List[str]


class BlameInfo(BaseModel):
    """Info git blame untuk suspect lines"""
    file_path: str
    line_number: int
    author: str
    commit_hash: str
    commit_date: datetime
    line_content: str


class ForensicsResult(BaseModel):
    """Output dari Forensics Agent"""
    recent_commits: List[CommitInfo]
    blame_info: List[BlameInfo]
    log_excerpts: List[str]
    suspect_files: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SuspectFile(BaseModel):
    """File yang dicurigai sebagai root cause"""
    path: str
    line_number: Optional[int] = None
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)


class RootCauseAnalysis(BaseModel):
    """Output dari Bob Agent - root cause analysis"""
    root_cause: str
    suspect_files: List[SuspectFile]
    reasoning_chain: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class FixProposal(BaseModel):
    """Output dari Fix Agent"""
    patch_unified_diff: str
    test_code: Optional[str] = None
    pr_title: str
    pr_body: str
    files_modified: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AgentEvent(BaseModel):
    """Event yang di-emit oleh agent untuk streaming"""
    agent_name: str
    status: AgentStatus
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class IncidentState(BaseModel):
    """State lengkap untuk satu incident investigation"""
    incident_id: str
    raw_input: str
    repo_path: Optional[str] = None
    
    # Results dari setiap agent
    triage: Optional[TriageResult] = None
    forensics: Optional[ForensicsResult] = None
    root_cause: Optional[RootCauseAnalysis] = None
    fix: Optional[FixProposal] = None
    postmortem: Optional[str] = None
    
    # Event log untuk streaming
    agent_events: List[AgentEvent] = Field(default_factory=list)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # pending, processing, completed, failed
    
    class Config:
        json_schema_extra = {
            "example": {
                "incident_id": "inc-123",
                "raw_input": "TypeError: Cannot read property 'quantity' of undefined",
                "repo_path": "/path/to/repo",
                "status": "processing"
            }
        }
