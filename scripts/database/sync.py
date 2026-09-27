import re

import pandas as pd
from sqlalchemy import MetaData, Table, inspect, select, text
from sqlalchemy.engine import Connection, Engine

SYNC_KEYS = {
    "instructor_grades": ["Term", "Subject", "Course Number", "Section", "Instructor"],
    "instructor_course_summary": ["Instructor", "Subject", "Course Number"],
}
SCHEDULE_TABLE = re.compile(r"(?:winter|spring|summer_[12]|fall)_20\d{2}")


def get_sync_keys(table_name: str) -> list[str]:
    if table_name in SYNC_KEYS:
        return SYNC_KEYS[table_name]
    if SCHEDULE_TABLE.fullmatch(table_name):
        return ["Code"]
    raise ValueError(f"Unsupported table: {table_name}")


def validate_rows(table_name: str, rows: pd.DataFrame) -> list[str]:
    keys = get_sync_keys(table_name)
    if rows.empty:
        raise ValueError(f"Refusing to replace {table_name} with an empty dataset.")
    if rows.columns.duplicated().any():
        raise ValueError(f"Duplicate columns in {table_name}.")
    missing = set(keys) - set(rows.columns)
    if missing:
        raise ValueError(f"Missing identifiers in {table_name}: {sorted(missing)}")
    for key in keys:
        if rows[key].isna().any() or rows[key].astype(str).str.strip().eq("").any():
            raise ValueError(f"Missing {key} values in {table_name}.")
    if table_name in SYNC_KEYS and rows.duplicated(subset=keys).any():
        raise ValueError(f"Duplicate identifiers in {table_name}.")
    if {"created", "last_updated"} & set(rows.columns):
        raise ValueError("Timestamps must be assigned by the database writer.")
    return keys


def prepare_rows(
    connection: Connection,
    table: Table | None,
    rows: pd.DataFrame,
    keys: list[str],
    now: pd.Timestamp,
) -> pd.DataFrame:
    result = rows.copy()
    for key in keys:
        result[key] = result[key].astype(str).str.strip()
    if table is None:
        result["created"] = now
    else:
        required = set(keys + ["created", "last_updated"])
        if not required.issubset(table.columns.keys()):
            raise ValueError(f"Missing required database columns in {table.name}.")
        existing = pd.read_sql(
            select(*(table.c[key] for key in keys), table.c.created), connection
        )
        for key in keys:
            existing[key] = existing[key].astype(str).str.strip()
        existing["created"] = pd.to_datetime(
            existing["created"], utc=True, errors="raise"
        )
        if existing["created"].isna().any():
            raise ValueError(f"Missing created timestamps in {table.name}.")
        existing = existing.groupby(keys, as_index=False)["created"].min()
        result = result.merge(existing, on=keys, how="left", validate="many_to_one")
        result["created"] = result["created"].fillna(now)
    result["last_updated"] = now
    return result


def sync_tables(engine: Engine, datasets: dict[str, pd.DataFrame]) -> dict[str, int]:
    if not datasets:
        raise ValueError("No datasets supplied.")
    keys = {name: validate_rows(name, rows) for name, rows in datasets.items()}
    counts = {}
    now = pd.Timestamp.now(tz="UTC")
    with engine.begin() as connection:
        if connection.dialect.name == "postgresql":
            connection.execute(text("SELECT pg_advisory_xact_lock(71632026)"))
        for name, rows in datasets.items():
            table = None
            if inspect(connection).has_table(name):
                table = Table(name, MetaData(), autoload_with=connection)
            prepared = prepare_rows(connection, table, rows, keys[name], now)
            if table is not None:
                connection.execute(table.delete())
            prepared.to_sql(
                name,
                connection,
                if_exists="append",
                index=False,
                method="multi",
                chunksize=500,
            )
            if table is None and connection.dialect.name == "postgresql":
                quoted = connection.dialect.identifier_preparer.quote(name)
                connection.execute(
                    text(f"GRANT SELECT ON {quoted} TO anon, authenticated")
                )
                connection.execute(
                    text(f"ALTER TABLE {quoted} ENABLE ROW LEVEL SECURITY")
                )
                connection.execute(
                    text(
                        f'CREATE POLICY "Enable public read" ON {quoted} '
                        "FOR SELECT TO public USING (true)"
                    )
                )
            counts[name] = len(prepared)
    return counts
