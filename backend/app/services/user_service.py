"""
Service layer for user CRUD operations
"""
from typing import Optional
from datetime import datetime
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.auth.security import get_password_hash, verify_password


class UserService:
    """Service for managing users"""

    @staticmethod
    async def create_user(
        db: AsyncSession,
        email: str,
        password: Optional[str] = None,
        full_name: Optional[str] = None,
        oauth_provider: Optional[str] = None,
        oauth_id: Optional[str] = None,
        avatar_url: Optional[str] = None,
        is_verified: bool = False
    ) -> User:
        """Create a new user"""
        user_id = f"user-{uuid.uuid4().hex[:12]}"
        
        hashed_password = None
        if password:
            hashed_password = get_password_hash(password)
        
        user = User(
            id=user_id,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            oauth_provider=oauth_provider,
            oauth_id=oauth_id,
            avatar_url=avatar_url,
            is_verified=is_verified,
            is_active=True,
            is_superuser=False
        )
        
        db.add(user)
        await db.flush()
        return user

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """Get user by ID"""
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_oauth(
        db: AsyncSession,
        oauth_provider: str,
        oauth_id: str
    ) -> Optional[User]:
        """Get user by OAuth provider and ID"""
        result = await db.execute(
            select(User).where(
                User.oauth_provider == oauth_provider,
                User.oauth_id == oauth_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        email: str,
        password: str
    ) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await UserService.get_user_by_email(db, email)
        
        if not user:
            return None
        
        if not user.hashed_password:
            # OAuth user without password
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user

    @staticmethod
    async def update_last_login(db: AsyncSession, user_id: str) -> None:
        """Update user's last login timestamp"""
        user = await UserService.get_user_by_id(db, user_id)
        if user:
            user.last_login = datetime.utcnow()
            await db.flush()

    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: str,
        **kwargs
    ) -> Optional[User]:
        """Update user fields"""
        user = await UserService.get_user_by_id(db, user_id)
        
        if not user:
            return None
        
        # Update allowed fields
        allowed_fields = ['full_name', 'avatar_url', 'is_active', 'is_verified', 'is_superuser']
        
        for field, value in kwargs.items():
            if field in allowed_fields and hasattr(user, field):
                setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        await db.flush()
        return user

    @staticmethod
    async def change_password(
        db: AsyncSession,
        user_id: str,
        new_password: str
    ) -> bool:
        """Change user password"""
        user = await UserService.get_user_by_id(db, user_id)
        
        if not user:
            return False
        
        user.hashed_password = get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        await db.flush()
        return True

    @staticmethod
    async def delete_user(db: AsyncSession, user_id: str) -> bool:
        """Delete user"""
        user = await UserService.get_user_by_id(db, user_id)
        
        if not user:
            return False
        
        await db.delete(user)
        await db.flush()
        return True
