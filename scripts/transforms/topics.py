import re

import pandas as pd


def parse_term(term: str) -> tuple[str | None, int | None]:
    value = str(term).strip().lower().replace("_", " ")
    year_match = re.search(r"(20\d{2}|\d{2})$", value)
    year = int(year_match.group(1)) if year_match else None
    if year is not None and year < 100:
        year += 2000
    season = None
    for name, prefixes in (
        ("summer", ("summer", "su", "u")),
        ("spring", ("spring", "sp", "s")),
        ("winter", ("winter", "win", "w")),
        ("fall", ("fall", "fa", "f")),
    ):
        if value.startswith(prefixes):
            season = name
            break
    return season, year


def clean_topic_title(title: str) -> str:
    result = re.sub(r"^(?:vt|scm|scs):?\s*", "", title, flags=re.IGNORECASE).strip()
    for pattern, replacement in (
        (r"\bAdv\s+Python\b", "Advanced Python"),
        (r"\bProgrammin\b", "Programming"),
        (r"\bForensic\b", "Forensics"),
    ):
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    return result


def build_topic_maps(courses: list[dict[str, str]]) -> tuple[dict, dict]:
    codes = {}
    sections = {}
    for course in courses:
        catalog = course["catalog"]
        if catalog not in {"381", "780"}:
            continue
        title = clean_topic_title(course["title"])
        if not title:
            continue
        for mapping, key in (
            (codes, (catalog, course["class_num"])),
            (sections, (catalog, course["section"])),
        ):
            if key in mapping and mapping[key] != title:
                raise ValueError(f"Conflicting topic titles for {key}.")
            mapping[key] = title
    return codes, sections


def enrich_schedule(rows: pd.DataFrame, term: str, topics: dict) -> pd.DataFrame:
    result = rows.copy()
    season, year = parse_term(term)
    if season is None or year is None or (season, year) not in topics:
        return result
    codes, sections = build_topic_maps(topics[(season, year)])
    for index, row in result.iterrows():
        match = re.match(
            r"^CSCI\s+(381|780)\b", str(row["Course (hr, crd)"]), re.IGNORECASE
        )
        if match:
            catalog = match.group(1)
            title = codes.get((catalog, str(row["Code"]).strip())) or sections.get(
                (catalog, str(row["Sec"]).strip())
            )
            if title:
                result.at[index, "Description"] = title
    return result


def enrich_grades(rows: pd.DataFrame, topics: dict) -> pd.DataFrame:
    result = rows.copy()
    maps = {term: build_topic_maps(courses)[1] for term, courses in topics.items()}
    for index, row in result.iterrows():
        catalog = str(row["Course Number"])
        if row["Subject"] != "CSCI" or catalog not in {"381", "780"}:
            continue
        season, year = parse_term(row["Term"])
        if season is None or year is None:
            continue
        title = maps.get((season, year), {}).get((catalog, str(row["Section"]).strip()))
        if title:
            result.at[index, "Course Name"] = title
    return result
