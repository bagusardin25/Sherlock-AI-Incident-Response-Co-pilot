# Backend Scaffolding - IBM BOB API Integration

**Task Date:** May 16, 2026  
**Mode:** Plan Mode  
**Objective:** Setup IBM BOB API key configuration in Sherlock backend

---

## 📋 Task Overview

Setup IBM BOB API key configuration in `backend/.env.example` to enable multi-agent AI support beyond OpenRouter.

### Initial Request
User requested to add IBM BOB API key configuration to the backend environment file, similar to the existing OpenRouter setup.

---

## 🔍 Analysis Phase

### Current Architecture Discovery

1. **Bob Client Implementation** ([`backend/app/bob_client.py`](../../backend/app/bob_client.py))
   - Uses CLI-based approach (subprocess execution)
   - Calls `bob` command with prompts
   - Mock mode available for testing
   - No direct API key usage in current implementation

2. **Configuration Structure** ([`backend/app/config.py`](../../backend/app/config.py))
   - Uses Pydantic Settings with `SHERLOCK_` prefix
   - Existing Bob settings:
     - `bob_mock_mode`: Boolean for mock responses
     - `bob_cli_path`: Path to Bob CLI executable
     - `bob_timeout`: Timeout for CLI operations

3. **OpenRouter Comparison** ([`backend/app/openrouter_client.py`](../../backend/app/openrouter_client.py))
   - REST API based implementation
   - Uses API key for authentication
   - Configuration includes:
     - `openrouter_api_key`
     - `openrouter_model`
     - `openrouter_timeout`

---

## 💡 Key Findings

### IBM BOB Architecture
- IBM BOB operates as a CLI tool, not a REST API
- Authentication likely happens through CLI configuration
- API key may be used for:
  - CLI authentication/authorization
  - Usage tracking
  - Rate limiting

### Configuration Requirements
Based on user confirmation, needed configuration:
- `SHERLOCK_IBM_BOB_API_KEY` - API key for IBM BOB authentication
- `SHERLOCK_IBM_BOB_PROJECT_ID` - Optional project identifier (if required)

---

## 📝 Proposed Implementation Plan

### Phase 1: Environment Configuration
1. Add IBM BOB settings to `backend/.env.example`:
   ```env
   # IBM BOB Settings
   SHERLOCK_IBM_BOB_API_KEY=your-ibm-bob-api-key-here
   SHERLOCK_IBM_BOB_PROJECT_ID=your-project-id-here
   SHERLOCK_IBM_BOB_MODEL=default
   ```

2. Update `backend/app/config.py`:
   ```python
   # IBM BOB Settings
   ibm_bob_api_key: str = ""
   ibm_bob_project_id: str = ""
   ibm_bob_model: str = "default"
   ```

### Phase 2: Bob Client Enhancement
1. Modify [`BobClient.__init__()`](../../backend/app/bob_client.py:37-46) to accept API key
2. Update CLI execution to pass API key (via environment or flag)
3. Add validation for API key presence when not in mock mode

### Phase 3: Documentation
1. Add comments explaining IBM BOB configuration
2. Document authentication flow
3. Update README with setup instructions

---

## 🎯 Success Criteria

- ✅ IBM BOB API key configuration added to `.env.example`
- ✅ Configuration properly loaded in `config.py`
- ✅ Bob client can use API key for authentication
- ✅ Follows same pattern as OpenRouter setup
- ✅ Backward compatible with existing mock mode
- ✅ Properly documented

---

## 🔄 Configuration Flow

```
.env file
    ↓
Settings (config.py)
    ↓
BobClient initialization
    ↓
CLI execution with API key
    ↓
IBM BOB authentication
```

---

## 📊 Comparison: OpenRouter vs IBM BOB

| Aspect | OpenRouter | IBM BOB |
|--------|-----------|---------|
| Interface | REST API | CLI Tool |
| Authentication | Bearer Token | API Key (CLI config) |
| Execution | HTTP Request | Subprocess |
| Response | JSON | JSON (stdout) |
| Timeout | HTTP timeout | Process timeout |

---

## ⚠️ Considerations

1. **CLI Authentication Method**
   - Need to verify how Bob CLI accepts API key
   - Options: environment variable, config file, CLI flag

2. **Security**
   - API key should not be logged
   - Secure storage in environment variables
   - Never commit actual keys to repository

3. **Error Handling**
   - Invalid API key detection
   - Authentication failure messages
   - Graceful fallback to mock mode

---

## 🚀 Next Steps

1. Implement configuration changes
2. Test with actual IBM BOB API key
3. Verify authentication flow
4. Update documentation
5. Switch to Code mode for implementation

---

## 📚 References

- IBM BOB Hackathon Documentation: [`ibm_bob_hackathon.md`](../../ibm_bob_hackathon.md)
- Current Bob Client: [`backend/app/bob_client.py`](../../backend/app/bob_client.py)
- Configuration Module: [`backend/app/config.py`](../../backend/app/config.py)
- OpenRouter Client (reference): [`backend/app/openrouter_client.py`](../../backend/app/openrouter_client.py)

---

**Status:** Planning Complete ✅  
**Ready for Implementation:** Yes  
**Recommended Mode:** Code Mode