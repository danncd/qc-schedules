import re

import pandas as pd

COLUMN_MAP = {
    "0": "Term",
    "term name": "Term",
    "term": "Term",
    "subject": "Subject",
    "nbr": "Course Number",
    "catalog nbr": "Course Number",
    "course number": "Course Number",
    "crs descr": "Course Name",
    "course name": "Course Name",
    "course description": "Course Name",
    "description": "Course Name",
    "class section": "Section",
    "section": "Section",
    "prof": "Instructor",
    "instructor": "Instructor",
    "total": "Total",
    "total enrl": "Total",
    "total enrolled": "Total",
    "total enrollment": "Total",
    "average gpa": "avg gpa",
    "avg gpa": "avg gpa",
    "fail": "f",
    "f": "f",
    "withdrawal": "w",
    "withdraw": "w",
    "w": "w",
    "inc/na": "inc",
    "inc/no grade": "inc",
    "incomplete": "inc",
    "inc": "inc",
}


GRADE_KEYS = ["Term", "Subject", "Course Number", "Section", "Instructor"]
INVALID_INSTRUCTORS = {
    "NAN",
    "STAFF",
    "NONE",
    "",
    "0",
    "0.0",
    "UNKNOWN",
    "TBA",
    "TBD",
    ",",
    "NULL",
}


def normalize_grades(sheets: dict[str, pd.DataFrame]) -> pd.DataFrame:
    frames = []
    for term, rows in sheets.items():
        if term == "COMBINED_OLD Pre-Fall19" or rows.empty:
            continue
        frame = rows.dropna(how="all").copy()
        frame.columns = [str(column).lower().strip() for column in frame.columns]
        frame = frame.rename(columns=COLUMN_MAP)
        frame = frame.loc[
            :, ~frame.columns.astype(str).str.contains(r"^Unnamed|^unnamed|^0\.0$")
        ]
        if frame.columns.duplicated().any():
            raise ValueError(f"Duplicate columns after renaming in {term}.")
        frame["Term"] = str(term).strip()
        historical = re.fullmatch(r"[sf](20\d{2})", str(term))
        if (
            "Instructor" not in frame.columns
            and historical
            and int(historical.group(1)) <= 2017
        ):
            print(f"Skipping {term}: historical worksheet has no instructor column.")
            continue
        missing = set(GRADE_KEYS + ["Total", "Course Name"]) - set(frame.columns)
        if missing:
            raise ValueError(f"{term} is missing columns: {', '.join(sorted(missing))}")
        for column in GRADE_KEYS:
            frame[column] = frame[column].astype("string").str.strip()
        for column in ("Instructor", "Subject", "Course Number"):
            frame[column] = frame[column].str.upper()
        for column in ("Course Number", "Section"):
            frame[column] = frame[column].str.replace(r"^(\d+)\.0$", r"\1", regex=True)
        frame = frame.dropna(subset=["Instructor", "Subject"])
        frame = frame[~frame["Instructor"].isin(INVALID_INSTRUCTORS)]
        frame = frame[frame["Instructor"].str.contains(r"[A-Z]", na=False)]
        frame["Total"] = pd.to_numeric(frame["Total"], errors="coerce")
        frame = frame[frame["Total"] > 0]
        if frame[GRADE_KEYS].isna().any().any() or frame[GRADE_KEYS].eq("").any().any():
            raise ValueError(f"Missing grade record identifiers in {term}.")
        frames.append(frame)
    if not frames:
        raise ValueError("No grade worksheets available.")
    result = pd.concat(frames, ignore_index=True).drop_duplicates()
    if result.empty:
        raise ValueError("No valid grade records remain.")
    if result.duplicated(subset=GRADE_KEYS).any():
        raise ValueError("Conflicting grade records share the same identifiers.")
    return result.reset_index(drop=True)
