"""
Triage Agent - Mengklasifikasi dan memprioritaskan incident alert
"""
import re
import logging
from typing import Optional
from datetime import datetime

from app.models.state import TriageResult, Severity, ErrorType

logger = logging.getLogger(__name__)


class TriageAgent:
    """Agent untuk triage incident berdasarkan raw alert input"""
    
    # Keyword patterns untuk severity detection
    SEVERITY_PATTERNS = {
        Severity.CRITICAL: [
            r'\bcritical\b', r'\bdown\b', r'\boutage\b', r'\bfatal\b',
            r'\bproduction\b.*\bdown\b', r'\bservice\b.*\bunavailable\b'
        ],
        Severity.HIGH: [
            r'\bhigh\b', r'\berror\b', r'\bfailed\b', r'\bexception\b',
            r'\bcrash\b', r'\bsegfault\b', r'\bpanic\b'
        ],
        Severity.MEDIUM: [
            r'\bmedium\b', r'\bwarning\b', r'\bwarn\b', r'\bdegraded\b',
            r'\bslow\b', r'\btimeout\b'
        ],
        Severity.LOW: [
            r'\blow\b', r'\binfo\b', r'\bnotice\b', r'\bdebug\b'
        ]
    }
    
    # Error type patterns
    ERROR_TYPE_PATTERNS = {
        ErrorType.NULL_POINTER: [
            r'null\s+pointer', r'cannot\s+read\s+property.*undefined',
            r'nullpointerexception', r'nil\s+pointer', r'undefined\s+is\s+not',
            r'cannot\s+access.*null'
        ],
        ErrorType.RACE_CONDITION: [
            r'race\s+condition', r'concurrent\s+modification',
            r'deadlock', r'thread\s+safety', r'synchronization'
        ],
        ErrorType.TIMEOUT: [
            r'timeout', r'timed\s+out', r'connection\s+timeout',
            r'read\s+timeout', r'request\s+timeout'
        ],
        ErrorType.MEMORY_LEAK: [
            r'memory\s+leak', r'out\s+of\s+memory', r'oom',
            r'heap\s+space', r'memory\s+exhausted'
        ],
        ErrorType.LOGIC_ERROR: [
            r'assertion\s+failed', r'invariant\s+violated',
            r'unexpected\s+state', r'invalid\s+state'
        ]
    }
    
    def __init__(self):
        """Initialize Triage Agent"""
        pass
    
    def triage(self, raw_alert: str, correlation_id: Optional[str] = None) -> TriageResult:
        """
        Analyze raw alert dan return triage result.
        
        Args:
            raw_alert: Raw alert text (stack trace, log, JSON, etc)
            correlation_id: Optional ID untuk tracking
            
        Returns:
            TriageResult dengan severity, service, error_type, dll
        """
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        logger.info(f"{log_prefix} Starting triage analysis")
        
        # Normalize input
        normalized = raw_alert.lower()
        
        # Detect severity
        severity = self._detect_severity(normalized)
        logger.debug(f"{log_prefix} Detected severity: {severity}")
        
        # Detect error type
        error_type = self._detect_error_type(normalized)
        logger.debug(f"{log_prefix} Detected error type: {error_type}")
        
        # Extract service name
        service = self._extract_service(raw_alert)
        logger.debug(f"{log_prefix} Extracted service: {service}")
        
        # Generate summary
        summary = self._generate_summary(raw_alert, severity, error_type)
        
        # Calculate confidence
        confidence = self._calculate_confidence(severity, error_type, service)
        
        result = TriageResult(
            severity=severity,
            service=service,
            error_type=error_type,
            summary=summary,
            confidence=confidence,
            timestamp=datetime.utcnow()
        )
        
        logger.info(f"{log_prefix} Triage completed: {severity.value} / {error_type.value}")
        return result
    
    def _detect_severity(self, text: str) -> Severity:
        """Detect severity dari text patterns"""
        # Check patterns dari highest ke lowest
        for severity in [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]:
            patterns = self.SEVERITY_PATTERNS[severity]
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return severity
        
        # Default: HIGH jika ada "error" atau "exception"
        if re.search(r'\berror\b|\bexception\b', text, re.IGNORECASE):
            return Severity.HIGH
        
        # Default fallback
        return Severity.MEDIUM
    
    def _detect_error_type(self, text: str) -> ErrorType:
        """Detect error type dari text patterns"""
        for error_type, patterns in self.ERROR_TYPE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return error_type
        
        return ErrorType.UNKNOWN
    
    def _extract_service(self, text: str) -> str:
        """Extract service name dari alert"""
        # Try common patterns
        patterns = [
            r'service[:\s]+([a-zA-Z0-9_-]+)',
            r'app[:\s]+([a-zA-Z0-9_-]+)',
            r'component[:\s]+([a-zA-Z0-9_-]+)',
            r'at\s+([a-zA-Z0-9_-]+)\.',  # from stack trace
            r'in\s+([a-zA-Z0-9_-]+)\s+service',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        # Try to extract from file path
        file_match = re.search(r'([a-zA-Z0-9_-]+)\.(js|ts|py|java|go)', text)
        if file_match:
            return file_match.group(1)
        
        return "unknown-service"
    
    def _generate_summary(self, text: str, severity: Severity, error_type: ErrorType) -> str:
        """Generate human-readable summary"""
        # Extract first meaningful line (skip empty lines)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        first_line = lines[0] if lines else text[:100]
        
        # Truncate if too long
        if len(first_line) > 150:
            first_line = first_line[:147] + "..."
        
        summary = f"{severity.value.upper()}: {error_type.value.replace('_', ' ').title()} - {first_line}"
        return summary
    
    def _calculate_confidence(self, severity: Severity, error_type: ErrorType, service: str) -> float:
        """Calculate confidence score untuk triage result"""
        confidence = 0.5  # base confidence
        
        # Boost confidence jika severity bukan default
        if severity in [Severity.CRITICAL, Severity.HIGH]:
            confidence += 0.2
        
        # Boost confidence jika error type terdeteksi
        if error_type != ErrorType.UNKNOWN:
            confidence += 0.2
        
        # Boost confidence jika service terdeteksi
        if service != "unknown-service":
            confidence += 0.1
        
        return min(confidence, 1.0)


# Global instance
triage_agent = TriageAgent()


def triage(raw_alert: str, correlation_id: Optional[str] = None) -> TriageResult:
    """
    Convenience function untuk triage.
    
    Usage:
        result = triage("TypeError: Cannot read property 'quantity' of undefined")
    """
    return triage_agent.triage(raw_alert, correlation_id)
