"""
Create all tables in Supabase.
Run once: python create_tables.py
"""
import asyncio
import ssl
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

# Session mode pooler (port 5432) with project-ref username
DATABASE_URL = "postgresql+asyncpg://postgres.eztbzczxyifdsvcatbcq:SuksesBerkah01%40@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

async def main():
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    engine = create_async_engine(
        DATABASE_URL,
        connect_args={
            "ssl": ssl_ctx,
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0,
        },
        poolclass=NullPool,
    )

    # Import all models
    from app.database import Base
    from app.models.db_models import Incident, TriageResult, ForensicsResult, RootCauseAnalysis, FixProposal, AgentEvent  # noqa
    from app.models.user import User  # noqa
    from app.models.api_key import APIKey  # noqa

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("All tables created successfully!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
