"""
Database configuration and session management
"""
import ssl
import socket
import logging
from urllib.parse import urlparse, urlunparse
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger(__name__)


def _resolve_ipv4_url(db_url: str) -> str:
    """
    Resolve database hostname to IPv4 to work around Railway IPv6 issues.
    Railway defaults to IPv6 but Supabase direct connections don't support it.
    """
    try:
        parsed = urlparse(db_url)
        if parsed.hostname:
            # Force IPv4 resolution
            results = socket.getaddrinfo(parsed.hostname, parsed.port, socket.AF_INET, socket.SOCK_STREAM)
            if results:
                ipv4 = results[0][4][0]
                # Replace hostname with IPv4 in netloc (handle user:pass@host:port)
                if parsed.port:
                    old_host_port = f"{parsed.hostname}:{parsed.port}"
                    new_host_port = f"{ipv4}:{parsed.port}"
                else:
                    old_host_port = parsed.hostname
                    new_host_port = ipv4
                netloc = parsed.netloc.replace(old_host_port, new_host_port)
                resolved = urlunparse(parsed._replace(netloc=netloc))
                logger.info(f"Resolved DB host {parsed.hostname} -> {ipv4}")
                return resolved
    except Exception as e:
        logger.warning(f"Could not resolve IPv4 for DB host: {e}, using original URL")
    return db_url


# Build connection args and resolve URL
connect_args = {}
db_url = settings.database_url

if "supabase" in settings.database_url:
    # Force IPv4 resolution for Supabase (Railway IPv6 workaround)
    # Only resolve if using direct connection (not pooler)
    if "pooler.supabase.com" not in settings.database_url:
        db_url = _resolve_ipv4_url(settings.database_url)
    # Create proper SSL context for Supabase
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args = {
        "ssl": ssl_ctx,
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    }

engine = create_async_engine(
    db_url,
    echo=settings.database_echo,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,
    connect_args=connect_args,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create declarative base for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency untuk mendapatkan database session.
    Digunakan dengan FastAPI Depends.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize database - create all tables
    """
    # Import all models so Base.metadata knows about them
    from app.models.api_key import APIKey  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Close database connections
    """
    await engine.dispose()
