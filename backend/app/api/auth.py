"""
Authentication API Routes
"""
import logging
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.starlette_client import OAuth

from app.database import get_db
from app.config import settings
from app.auth.security import create_access_token, create_refresh_token, verify_token
from app.auth.dependencies import get_current_user, get_current_active_user
from app.services.user_service import UserService
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# OAuth setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)


# Request/Response Models
class UserRegister(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class UserResponse(BaseModel):
    """User response"""
    id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    is_verified: bool
    created_at: datetime


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user with email and password
    """
    # Check if user already exists
    existing_user = await UserService.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = await UserService.create_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        is_verified=False  # Require email verification
    )
    
    await db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Update last login
    await UserService.update_last_login(db, user.id)
    await db.commit()
    
    logger.info(f"New user registered: {user.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password
    """
    # Authenticate user
    user = await UserService.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Update last login
    await UserService.update_last_login(db, user.id)
    await db.commit()
    
    logger.info(f"User logged in: {user.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified
        }
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    # Verify refresh token
    user_id = verify_token(token_data.refresh_token, token_type="refresh")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user
    user = await UserService.get_user_by_id(db, user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user information
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at
    )


@router.get("/google/login")
async def google_login(request: Request):
    """
    Initiate Google OAuth login
    """
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth not configured"
        )
    
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Google OAuth callback
    """
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth not configured"
        )
    
    try:
        # Exchange code for token
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )
        
        email = user_info.get('email')
        google_id = user_info.get('sub')
        full_name = user_info.get('name')
        avatar_url = user_info.get('picture')
        
        if not email or not google_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user info from Google"
            )
        
        # Check if user exists with this Google account
        user = await UserService.get_user_by_oauth(db, "google", google_id)
        
        if not user:
            # Check if email already exists
            user = await UserService.get_user_by_email(db, email)
            
            if user:
                # Link Google account to existing user
                user.oauth_provider = "google"
                user.oauth_id = google_id
                if not user.avatar_url:
                    user.avatar_url = avatar_url
            else:
                # Create new user
                user = await UserService.create_user(
                    db=db,
                    email=email,
                    full_name=full_name,
                    oauth_provider="google",
                    oauth_id=google_id,
                    avatar_url=avatar_url,
                    is_verified=True  # Google accounts are pre-verified
                )
        
        await db.commit()
        
        # Create tokens
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})
        
        # Update last login
        await UserService.update_last_login(db, user.id)
        await db.commit()
        
        logger.info(f"User logged in via Google: {user.email}")
        
        # Redirect to frontend with tokens
        frontend_url = settings.cors_origins[0] if settings.cors_origins else "http://localhost:3000"
        return RedirectResponse(
            url=f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
        )
        
    except Exception as e:
        logger.error(f"Google OAuth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth failed: {str(e)}"
        )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout current user
    Note: In JWT, logout is handled client-side by removing tokens
    """
    logger.info(f"User logged out: {current_user.email}")
    
    return {
        "message": "Successfully logged out",
        "detail": "Please remove tokens from client storage"
    }
