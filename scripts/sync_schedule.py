import argparse
from pathlib import Path

from dotenv import load_dotenv

from scripts.database.connection import create_database_engine
from scripts.database.sync import sync_tables, validate_rows
from scripts.sources.schedules import fetch_schedules
from scripts.sources.topic_titles import fetch_topic_courses
from scripts.transforms.schedules import normalize_schedule
from scripts.transforms.topics import enrich_schedule, parse_term


def run(year: int | None = None, commit: bool = False) -> dict[str, int]:
    schedules = fetch_schedules(year)
    if not schedules:
        raise ValueError("No schedules were returned.")
    terms = {parse_term(name) for name in schedules}
    if any(season is None or year is None for season, year in terms):
        raise ValueError("Unrecognized schedule term.")
    topics = fetch_topic_courses(terms)
    datasets = {
        name: enrich_schedule(normalize_schedule(rows), name, topics)
        for name, rows in schedules.items()
    }
    for name, rows in datasets.items():
        validate_rows(name, rows)
        print(f"{name}: {len(rows)} prepared rows")
    if not commit:
        print("Preview complete. No database connection or writes were made.")
        return {name: len(rows) for name, rows in datasets.items()}
    engine = create_database_engine()
    try:
        return sync_tables(engine, datasets)
    finally:
        engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Prepare or sync QC course schedules.")
    parser.add_argument("--year", type=int)
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Write prepared schedules to the database.",
    )
    args = parser.parse_args()
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    run(year=args.year, commit=args.commit)


if __name__ == "__main__":
    main()
