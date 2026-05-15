"""
SQLAlchemy database models untuk Sherlock
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Incident(Base):
    """Model untuk incident/alert"""
    __tablename__ = "incidents"
    
    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    
    # Alert metadata
    alert_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    triage_results = relationship("TriageResult", back_populates="incident", cascade="all, delete-orphan")
    forensics_results = relationship("ForensicsResult", back_populates="incident", cascade="all, delete-orphan")
    root_cause_analyses = relationship("RootCauseAnalysis", back_populates="incident", cascade="all, delete-orphan")
    fix_proposals = relationship("FixProposal", back_populates="incident", cascade="all, delete-orphan")
    agent_events = relationship("AgentEvent", back_populates="incident", cascade="all, delete-orphan")


class TriageResult(Base):
    """Model untuk hasil triage"""
    __tablename__ = "triage_results"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    
    severity = Column(String(20), nullable=False)
    category = Column(String(50), nullable=False)
    summary = Column(Text, nullable=False)
    recommended_actions = Column(JSON, nullable=False)  # List of strings
    
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship
    incident = relationship("Incident", back_populates="triage_results")


class ForensicsResult(Base):
    """Model untuk hasil forensics"""
    __tablename__ = "forensics_results"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    
    suspect_files = Column(JSON, nullable=False)  # List of SuspectFile objects
    git_history = Column(JSON, nullable=True)  # List of CommitInfo objects
    blame_info = Column(JSON, nullable=True)  # List of BlameInfo objects
    
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship
    incident = relationship("Incident", back_populates="forensics_results")


class RootCauseAnalysis(Base):
    """Model untuk root cause analysis"""
    __tablename__ = "root_cause_analyses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    
    root_cause = Column(Text, nullable=False)
    contributing_factors = Column(JSON, nullable=False)  # List of strings
    evidence = Column(JSON, nullable=False)  # List of strings
    confidence = Column(String(20), nullable=False)
    
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship
    incident = relationship("Incident", back_populates="root_cause_analyses")


class FixProposal(Base):
    """Model untuk fix proposal"""
    __tablename__ = "fix_proposals"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    
    description = Column(Text, nullable=False)
    code_changes = Column(JSON, nullable=False)  # List of code change objects
    test_plan = Column(JSON, nullable=False)  # List of strings
    rollback_plan = Column(Text, nullable=False)
    
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship
    incident = relationship("Incident", back_populates="fix_proposals")


class AgentEvent(Base):
    """Model untuk agent events/logs"""
    __tablename__ = "agent_events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    
    agent = Column(String(50), nullable=False)
    event_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)
    
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship
    incident = relationship("Incident", back_populates="agent_events")
