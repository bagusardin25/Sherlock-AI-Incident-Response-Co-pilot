"""
Bob CLI Wrapper - Interface untuk memanggil IBM Bob CLI
"""
import asyncio
import json
import logging
import os
from pathlib import Path
from typing import TypeVar, Type, Optional, Dict, Any
from pydantic import BaseModel, ValidationError

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)


class BobError(Exception):
    """Base exception untuk Bob-related errors"""
    pass


class BobTimeoutError(BobError):
    """Raised ketika Bob CLI timeout"""
    pass


class BobParseError(BobError):
    """Raised ketika Bob output tidak bisa di-parse"""
    pass


class BobClient:
    """Client untuk berinteraksi dengan Bob CLI"""
    
    def __init__(
        self,
        cli_path: str = None,
        timeout: int = None,
        mock_mode: bool = None
    ):
        self.cli_path = cli_path or settings.bob_cli_path
        self.timeout = timeout or settings.bob_timeout
        self.mock_mode = mock_mode if mock_mode is not None else settings.bob_mock_mode
        self.fixtures_path = Path(settings.fixtures_path) / "bob_responses"
        
    async def ask_bob(
        self,
        prompt: str,
        repo_path: str,
        output_schema: Type[T],
        correlation_id: Optional[str] = None
    ) -> T:
        """
        Memanggil Bob CLI dengan prompt dan mengharapkan output sesuai schema.
        
        Args:
            prompt: Prompt untuk Bob
            repo_path: Path ke repository yang akan dianalisis
            output_schema: Pydantic model untuk validasi output
            correlation_id: ID untuk tracking/logging
            
        Returns:
            Instance dari output_schema dengan data dari Bob
            
        Raises:
            BobTimeoutError: Jika Bob timeout
            BobParseError: Jika output tidak valid
            BobError: Error lainnya
        """
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        logger.info(f"{log_prefix} Calling Bob with schema: {output_schema.__name__}")
        
        if self.mock_mode:
            logger.info(f"{log_prefix} Mock mode enabled, returning canned response")
            return await self._get_mock_response(output_schema, correlation_id)
        
        try:
            # Construct structured prompt dengan schema hint
            structured_prompt = self._construct_prompt(prompt, output_schema)
            
            # Execute Bob CLI
            result = await self._execute_bob_cli(
                structured_prompt,
                repo_path,
                correlation_id
            )
            
            # Parse and validate output
            return await self._parse_output(result, output_schema, correlation_id)
            
        except asyncio.TimeoutError:
            logger.error(f"{log_prefix} Bob CLI timeout after {self.timeout}s")
            raise BobTimeoutError(f"Bob CLI timeout after {self.timeout}s")
        except ValidationError as e:
            logger.error(f"{log_prefix} Bob output validation failed: {e}")
            raise BobParseError(f"Failed to parse Bob output: {e}")
        except Exception as e:
            logger.error(f"{log_prefix} Unexpected error calling Bob: {e}")
            raise BobError(f"Error calling Bob: {e}")
    
    def _construct_prompt(self, prompt: str, schema: Type[BaseModel]) -> str:
        """Construct prompt dengan schema hint untuk structured output"""
        schema_json = schema.model_json_schema()
        
        structured_prompt = f"""
{prompt}

IMPORTANT: Please respond with a valid JSON object that matches this schema:

{json.dumps(schema_json, indent=2)}

Your response should be ONLY the JSON object, no additional text or explanation.
"""
        return structured_prompt
    
    async def _execute_bob_cli(
        self,
        prompt: str,
        repo_path: str,
        correlation_id: Optional[str] = None
    ) -> str:
        """Execute Bob CLI sebagai subprocess"""
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        
        # Construct command
        # Asumsi: bob CLI menerima prompt via stdin atau --prompt flag
        # Adjust sesuai actual Bob CLI interface
        cmd = [
            self.cli_path,
            "ask",
            "--repo", repo_path,
            "--format", "json"
        ]
        
        logger.debug(f"{log_prefix} Executing: {' '.join(cmd)}")
        
        # Create subprocess
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=repo_path
        )
        
        try:
            # Send prompt and wait for response
            stdout, stderr = await asyncio.wait_for(
                process.communicate(prompt.encode('utf-8')),
                timeout=self.timeout
            )
            
            if process.returncode != 0:
                error_msg = stderr.decode('utf-8')
                logger.error(f"{log_prefix} Bob CLI failed: {error_msg}")
                raise BobError(f"Bob CLI failed with code {process.returncode}: {error_msg}")
            
            output = stdout.decode('utf-8')
            logger.debug(f"{log_prefix} Bob output length: {len(output)} chars")
            
            return output
            
        except asyncio.TimeoutError:
            # Kill process on timeout
            try:
                process.kill()
                await process.wait()
            except:
                pass
            raise
    
    async def _parse_output(
        self,
        output: str,
        schema: Type[T],
        correlation_id: Optional[str] = None,
        retry: bool = True
    ) -> T:
        """Parse dan validate Bob output"""
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        
        try:
            # Try to extract JSON from output (Bob might include extra text)
            json_str = self._extract_json(output)
            data = json.loads(json_str)
            
            # Validate with Pydantic
            result = schema.model_validate(data)
            logger.info(f"{log_prefix} Successfully parsed Bob output")
            return result
            
        except (json.JSONDecodeError, ValidationError) as e:
            if retry:
                logger.warning(f"{log_prefix} Parse failed, attempting retry with cleaned output")
                # Try to clean and retry once
                cleaned = self._clean_output(output)
                return await self._parse_output(cleaned, schema, correlation_id, retry=False)
            else:
                logger.error(f"{log_prefix} Failed to parse Bob output after retry")
                raise BobParseError(f"Could not parse Bob output: {e}")
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON object from text yang mungkin ada extra content"""
        # Find first { and last }
        start = text.find('{')
        end = text.rfind('}')
        
        if start == -1 or end == -1:
            raise ValueError("No JSON object found in output")
        
        return text[start:end+1]
    
    def _clean_output(self, text: str) -> str:
        """Clean output untuk retry parsing"""
        # Remove markdown code blocks
        text = text.replace('```json', '').replace('```', '')
        # Remove extra whitespace
        text = text.strip()
        return text
    
    async def _get_mock_response(
        self,
        schema: Type[T],
        correlation_id: Optional[str] = None
    ) -> T:
        """Get canned response dari fixtures untuk testing"""
        log_prefix = f"[{correlation_id}]" if correlation_id else ""
        
        # Map schema to fixture file
        fixture_map = {
            "RootCauseAnalysis": "root_cause_analysis.json",
            "FixProposal": "fix_proposal.json",
        }
        
        fixture_file = fixture_map.get(schema.__name__)
        if not fixture_file:
            logger.warning(f"{log_prefix} No mock fixture for {schema.__name__}, using default")
            # Return minimal valid instance
            return schema.model_validate({})
        
        fixture_path = self.fixtures_path / fixture_file
        
        if not fixture_path.exists():
            logger.warning(f"{log_prefix} Mock fixture not found: {fixture_path}")
            return schema.model_validate({})
        
        try:
            with open(fixture_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"{log_prefix} Loaded mock response from {fixture_file}")
            return schema.model_validate(data)
            
        except Exception as e:
            logger.error(f"{log_prefix} Error loading mock fixture: {e}")
            return schema.model_validate({})


# Global client instance
bob_client = BobClient()


async def ask_bob(
    prompt: str,
    repo_path: str,
    output_schema: Type[T],
    correlation_id: Optional[str] = None
) -> T:
    """
    Convenience function untuk memanggil Bob.
    
    Usage:
        result = await ask_bob(
            "Analyze this bug...",
            "/path/to/repo",
            RootCauseAnalysis,
            correlation_id="inc-123"
        )
    """
    return await bob_client.ask_bob(prompt, repo_path, output_schema, correlation_id)
