"""
Authentication dependencies for FastAPI
"""
import hashlib
from datetime import datetime
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.security import verify_token
from app.services.user_service import UserService
from app.models.user import User
from app.models.api_key import APIKey

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)


async def get_user_from_api_key(db: AsyncSession, api_key: str) -> Optional[User]:
    """
    Resolve a CLI/API key to an active user.
    """
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    result = await db.execute(
        select(APIKey).where(APIKey.key_hash == key_hash, APIKey.is_active == True)  # noqa: E712
    )
    stored_key = result.scalar_one_or_none()
    if not stored_key:
        return None

    user = await UserService.get_user_by_id(db, stored_key.user_id)
    if not user or not user.is_active:
        return None

    stored_key.last_used_at = datetime.utcnow()
    await db.flush()
    return user


async def get_user_from_access_token_or_api_key(db: AsyncSession, token: str) -> Optional[User]:
    """
    Resolve either a browser JWT access token or a CLI API key.
    """
    user_id = verify_token(token, token_type="access")
    if user_id:
        user = await UserService.get_user_by_id(db, user_id)
        if user and user.is_active:
            return user

    return await get_user_from_api_key(db, token)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from a browser JWT or CLI API key.
    
    Raises:
        HTTPException: If credentials are invalid or user not found
    """
    import logging
    _log = logging.getLogger(__name__)
    _log.info(f"[auth] get_current_user: credentials={'present' if credentials else 'None'}, x_api_key={'present' if x_api_key else 'None'}")

    if credentials:
        _log.info(f"[auth] Bearer token (first 20 chars): {credentials.credentials[:20]}...")
        user = await get_user_from_access_token_or_api_key(db, credentials.credentials)
        if user:
            _log.info(f"[auth] User resolved from Bearer token: {user.email}")
            return user
        _log.warning(f"[auth] Bearer token did NOT resolve to a valid user")

    if x_api_key:
        user = await get_user_from_api_key(db, x_api_key)
        if user:
            return user

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    _log.warning("[auth] No credentials provided at all")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user
    
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current verified user
    
    Raises:
        HTTPException: If user is not verified
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current superuser
    
    Raises:
        HTTPException: If user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise
    Useful for endpoints that work with or without authentication
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    user_id = verify_token(token, token_type="access")
    
    if not user_id:
        return None
    
    user = await UserService.get_user_by_id(db, user_id)
    
    if not user or not user.is_active:
        return None
    
    return user
