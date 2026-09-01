import asyncio
import os
from logging.config import fileConfig
from dotenv import load_dotenv
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context


load_dotenv() # Loades .env file


from app.models.base import Base
import app.models


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config


database_url = os.environ.get("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)


# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata       # They're the models defined in app.models. Base.metadata delivers this map to Alembic.


def run_migrations_offline() -> None:  # Gets involved only if you use --sql at the end of the command (ex. alembic upgrade head --sql)

    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,            # It returns the raw SQL query in the terminal, useful if you have to give the entire SQL db file
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:  # This is the synchronous function
    context.configure(connection=connection,
                      target_metadata=target_metadata,
                      compare_type=True,  # Fondamentale: rileva cambi (es. da String(50) a String(255))
                      compare_server_default=True,  # Rileva cambi nei server_default
                      )  # Gives Alembic the connection to the db and the metadata of the tables

    with context.begin_transaction():  # All or nothing: if the operation goes wrong, all the previous actions are rolled back (deleted)
        context.run_migrations()       # With this you execute the actual queries on the db


async def run_async_migrations() -> None:

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",    # It finds the url in the dict
        poolclass=pool.NullPool, # Done with the operation, the memory will be freed
    )

    async with connectable.connect() as connection:  # Opens the connection
        await connection.run_sync(do_run_migrations) # Takes the synchronous function and lets it run through our asynchronous connection

    await connectable.dispose() # Closes the engine


def run_migrations_online() -> None:

    asyncio.run(run_async_migrations()) # It creates an asynchronous environment, executing the main asynchronous func and shutting down when completed


if context.is_offline_mode():
    run_migrations_offline()      # It activates if you add --sql after the command 'alembic upgrade head' in the terminal to run migrations offline
else:
    run_migrations_online()