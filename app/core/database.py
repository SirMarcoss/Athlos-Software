from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession


# Creating connection engin to the db
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Previene crash se la connessione cade lato DB
    pool_size=10,        # Numero massimo di connessioni stabili mantenute aperte
    max_overflow=20      # Connessioni extra temporanee nei momenti di picco
)
# Creating a single session per user
SessionLocal = async_sessionmaker(
    engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)
# Removing autocommit gives you full control over saving operations
# Autoflush prepares information for autocommit, keeping it active makes no sense


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as db:
        yield db

        # Regardless of whether the function is finished or not(crash), the db closes