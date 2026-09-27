import os

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine, make_url


def create_database_engine(database_url: str | None = None) -> Engine:
    url = database_url or os.environ.get("SUPABASE_DB_URL")
    if not url:
        raise ValueError("SUPABASE_DB_URL is not configured.")
    parsed = make_url(url)
    if parsed.get_backend_name() != "postgresql":
        raise ValueError("A PostgreSQL database URL is required.")
    return create_engine(
        parsed.set(drivername="postgresql+psycopg2"),
        pool_pre_ping=True,
        connect_args={
            "connect_timeout": 10,
            "options": "-c timezone=UTC -c lock_timeout=30000 -c statement_timeout=300000",
        },
        hide_parameters=True,
    )
