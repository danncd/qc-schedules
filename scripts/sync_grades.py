import argparse
from pathlib import Path

from dotenv import load_dotenv

from scripts.database.connection import create_database_engine
from scripts.database.sync import sync_tables, validate_rows
from scripts.sources.grades import fetch_grade_sheets
from scripts.sources.topic_titles import fetch_topic_courses
from scripts.transforms.grades import normalize_grades
from scripts.transforms.instructor_summaries import build_instructor_summaries
from scripts.transforms.topics import enrich_grades, parse_term


def run(commit: bool = False) -> dict[str, int]:
    grades = normalize_grades(fetch_grade_sheets())
    terms = {parse_term(term) for term in grades["Term"].unique()}
    terms = {
        (season, year)
        for season, year in terms
        if season is not None and year is not None
    }
    grades = enrich_grades(grades, fetch_topic_courses(terms))
    datasets = {
        "instructor_grades": grades,
        "instructor_course_summary": build_instructor_summaries(grades),
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
    parser = argparse.ArgumentParser(
        description="Prepare or sync QC grades and instructor summaries."
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Write grades and summaries to the database.",
    )
    args = parser.parse_args()
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    run(commit=args.commit)


if __name__ == "__main__":
    main()
