import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Create tables on startup (idempotent — migrations handle schema)."""
    try:
        async with engine.begin() as conn:
            # Tables are managed via SQL migrations; just verify connectivity.
            await conn.run_sync(lambda c: c.execute(c.connection.driver_connection.cursor(), "SELECT 1"))
        logger.info("Database connection established.")
    except Exception as exc:
        logger.warning("Database not yet reachable: %s", exc)


async def close_db():
    await engine.dispose()
    logger.info("Database connection pool closed.")


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
