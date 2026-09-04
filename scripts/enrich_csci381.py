#!/usr/bin/env python3

import argparse
import io
import os
import re
import sys
import urllib.request
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin

import pandas as pd
import pypdf
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

BASE_INDEX_URL = "https://www.cs.qc.cuny.edu/index-3.html"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

TERM_TO_TABLES = {
    "winter": ["winter_2026"],
    "spring": ["spring_2026"],
    "summer": ["summer_1_2026", "summer_2_2026"],
    "fall": ["fall_2026"],
}


def clean_text(s: str) -> str:
    """Normalize whitespace and non-breaking spaces."""
    return re.sub(r"\s+", " ", s.replace("\xa0", " ")).strip()


def discover_schedule_pdfs(index_url: str = BASE_INDEX_URL) -> Dict[str, str]:
    """
    Scrape https://www.cs.qc.cuny.edu/index-3.html to discover the current
    Computer Science schedule PDF links.
    Returns:
        Dict mapping season ('winter', 'spring', 'summer', 'fall') to full PDF URL.
    """
    req = urllib.request.Request(index_url, headers=HEADERS)
    html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8")
    soup = BeautifulSoup(html, "html.parser")

    schedules: Dict[str, str] = {}
    schedule_anchor = soup.find("a", attrs={"name": "schedule"})
    
    if schedule_anchor:
        ol = schedule_anchor.find_next("ol")
        if ol:
            for a in ol.find_all("a", href=True):
                label = (a.get_text(strip=True) or a.get("aria-label", "")).strip().lower()
                href = urljoin(index_url, a["href"])
                for season in ["winter", "spring", "summer", "fall"]:
                    if season in label:
                        schedules[season] = href
                        break

    # Fallback to standard URL schema if site anchor changes
    if not schedules:
        year = str(pd.Timestamp.now().year)[2:]
        schedules = {
            "winter": f"https://www.cs.qc.cuny.edu/schedule/sp{year}/win{year}.pdf",
            "spring": f"https://www.cs.qc.cuny.edu/schedule/sp{year}/sp{year}.pdf",
            "summer": f"https://www.cs.qc.cuny.edu/schedule/su{year}/su{year}.pdf",
            "fall": f"https://www.cs.qc.cuny.edu/schedule/fa{year}/fa{year}.pdf",
        }

    return schedules


def parse_cs_schedule_pdf(pdf_source: Any) -> List[Dict[str, str]]:
    """
    Adaptively parse a Queens College Computer Science PDF schedule into a list
    of course dictionaries, gracefully handling:
    - Differing column headers (Session present vs absent)
    - Reordered ID columns (Section Class# Assoc vs Section Assoc Class#)
    - Unassigned / TBA instructors and modes
    - Multi-line course descriptions or special topics
    """
    if isinstance(pdf_source, str):
        if pdf_source.startswith("http://") or pdf_source.startswith("https://"):
            req = urllib.request.Request(pdf_source, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                pdf_bytes = resp.read()
        else:
            with open(pdf_source, "rb") as f:
                pdf_bytes = f.read()
    else:
        pdf_bytes = pdf_source

    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    courses: List[Dict[str, str]] = []

    for page in reader.pages:
        text_content = page.extract_text()
        if not text_content:
            continue

        lines = text_content.split("\n")
        header_layout = None

        for raw_line in lines:
            line = clean_text(raw_line)
            if not line:
                continue

            # Detect and analyze header row
            if "Component" in line and "Catalog" in line:
                tokens = line.lower().split()
                has_session = "session" in tokens
                class_idx = tokens.index("class#") if "class#" in tokens else -1
                assoc_idx = tokens.index("assoc") if "assoc" in tokens else -1
                header_layout = {
                    "has_session": has_session,
                    "class_before_assoc": class_idx < assoc_idx if (class_idx != -1 and assoc_idx != -1) else False,
                }
                continue

            # Skip footer/page indicator lines
            if re.match(r"^\d+\s+of\s+\d+$", line):
                continue
            if any(term_indicator in line for term_indicator in ["Winter Session", "Spring 202", "Summer 202", "Fall 202"]):
                continue

            # Match course row:
            # Matches optional session code (e.g. 4W1, 7W2), Component, CSCI, Catalog#, Section, id1, id2, rest
            m = re.match(
                r"^(?:(?P<session>[0-9A-Za-z]+)\s+)?"
                r"(?P<component>LEC|LAB|SEM|REC|IND)\s+"
                r"(?:CSCI\s+)+"
                r"(?P<catalog>\d+[A-Za-z]*)\s+"
                r"(?P<section>\S+)\s+"
                r"(?P<id1>\S+)\s+"
                r"(?P<id2>\S+)\s+"
                r"(?P<rest>.+)$",
                line,
            )
            if not m:
                continue

            gd = m.groupdict()
            component = gd["component"]
            catalog = gd["catalog"]
            section = gd["section"]
            id1, id2 = gd["id1"], gd["id2"]
            rest = gd["rest"]

            # Unambiguously determine Class# vs Assoc based on layout or numerical length
            if header_layout and header_layout["class_before_assoc"]:
                class_num, assoc = id1, id2
            elif header_layout and not header_layout["class_before_assoc"]:
                assoc, class_num = id1, id2
            else:
                if len(id1) >= 4 and id1.isdigit() and not (len(id2) >= 4 and id2.isdigit()):
                    class_num, assoc = id1, id2
                else:
                    assoc, class_num = id1, id2

            # Parse schedule suffix (Days, Start, End, Room, Instructor, Mode)
            sched_m = re.search(
                r"\s+(?P<days>[A-Za-z]+|TBA)\s+"
                r"(?P<start>\d{1,2}:\d{2}(?:AM|PM)|TBA)\s+"
                r"(?P<end>\d{1,2}:\d{2}(?:AM|PM)|TBA)\s+"
                r"(?P<room>\S+)"
                r"(?:\s+(?P<instructor_and_mode>.+))?$",
                rest,
            )

            if sched_m:
                title = rest[: sched_m.start()].strip()
                days = sched_m.group("days")
                start = sched_m.group("start")
                end = sched_m.group("end")
                room = sched_m.group("room")
                inst_mode = sched_m.group("instructor_and_mode") or ""

                mode_m = re.search(r"\s+([A-Z]{1,3})$", inst_mode)
                if mode_m:
                    mode = mode_m.group(1)
                    instructor = inst_mode[: mode_m.start()].strip()
                else:
                    mode = "TBA"
                    instructor = inst_mode.strip()
            else:
                title = rest.strip()
                days = start = end = room = instructor = mode = "TBA"

            courses.append({
                "session": gd.get("session") or "",
                "component": component,
                "subject": "CSCI",
                "catalog": catalog,
                "section": section,
                "class_num": class_num,
                "assoc": assoc,
                "title": title,
                "days": days,
                "start": start,
                "end": end,
                "room": room,
                "instructor": instructor,
                "mode": mode,
            })

    return courses


def get_csci_381_topic_maps(pdf_source: Any) -> Tuple[Dict[str, str], Dict[str, str]]:
    """
    Extracts mappings of CSCI 381 specific titles:
    Returns (code_to_title, section_to_title).
    """
    courses = parse_cs_schedule_pdf(pdf_source)
    code_map: Dict[str, str] = {}
    sec_map: Dict[str, str] = {}

    for c in courses:
        if c["catalog"] == "381":
            title = c["title"].strip()
            title = re.sub(r"^vt:?\s*", "", title, flags=re.IGNORECASE).strip()
            if title:
                code_map[c["class_num"]] = title
                sec_map[c["section"]] = title

    return code_map, sec_map


def enrich_schedule_df(df: pd.DataFrame, season: str, code_map: Dict[str, str], sec_map: Dict[str, str]) -> pd.DataFrame:
    """
    Enriches CSCI 381 rows in a scraped course schedule DataFrame with the
    specific topic title from the CS department schedule.
    """
    if df is None or df.empty:
        return df

    df = df.copy()

    course_col = next((c for c in df.columns if "Course" in str(c)), None)
    desc_col = "Description" if "Description" in df.columns else None

    if not course_col or not desc_col:
        return df

    def update_description(row):
        course_str = str(row[course_col]).strip()
        current_desc = str(row[desc_col]).strip()

        if course_str.startswith("CSCI 381"):
            code = str(row.get("Code", "")).strip()
            sec = str(row.get("Sec", "")).strip()

            matched_title = code_map.get(code) or sec_map.get(sec)
            if matched_title:
                return matched_title

        return current_desc

    df[desc_col] = df.apply(update_description, axis=1)
    return df


def enrich_all_schedules(all_semesters_df: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """
    Given the dictionary of scraped DataFrames from get_course_data(),
    discovers CS department schedule PDFs and enriches all CSCI 381 rows.
    """
    print("[*] Fetching CS department schedule PDFs for CSCI 381 enrichment...")
    pdf_urls = discover_schedule_pdfs()

    pdf_maps: Dict[str, Tuple[Dict[str, str], Dict[str, str]]] = {}
    for season, url in pdf_urls.items():
        try:
            print(f"    Parsing {season.capitalize()} schedule from {url}...")
            pdf_maps[season] = get_csci_381_topic_maps(url)
        except Exception as e:
            print(f"    Warning: Could not parse {season} PDF ({e}).")

    enriched: Dict[str, pd.DataFrame] = {}
    for sem_name, df in all_semesters_df.items():
        # Match semester name to season key
        sem_lower = sem_name.lower()
        matched_season = None
        for s in ["winter", "spring", "summer", "fall"]:
            if s in sem_lower:
                matched_season = s
                break

        if matched_season and matched_season in pdf_maps:
            code_map, sec_map = pdf_maps[matched_season]
            df = enrich_schedule_df(df, matched_season, code_map, sec_map)
            print(f"[+] Enriched CSCI 381 topics for {sem_name}.")

        enriched[sem_name] = df

    return enriched



def get_term_season_year(term: str) -> Tuple[Optional[str], Optional[str]]:
    t = term.lower().strip()
    m_year = re.search(r"(20\d\d|\d{2})$", t)
    year = m_year.group(1) if m_year else None
    if year and len(year) == 2:
        year = "20" + year

    season = None
    if "summer" in t or t.startswith("su") or t.startswith("u"):
        season = "summer"
    elif "spring" in t or t.startswith("sp") or t.startswith("s"):
        season = "spring"
    elif "winter" in t or t.startswith("win") or t.startswith("w"):
        season = "winter"
    elif "fall" in t or t.startswith("fa") or t.startswith("f"):
        season = "fall"
    return season, year


def enrich_grades_df(
    df: pd.DataFrame,
    pdf_maps: Optional[Dict[str, Tuple[Dict[str, str], Dict[str, str]]]] = None,
    pdf_years: Optional[Dict[str, str]] = None,
) -> pd.DataFrame:
    if df is None or df.empty:
        return df

    if "Subject" not in df.columns or "Course Number" not in df.columns or "Course Name" not in df.columns:
        return df

    if pdf_maps is None or pdf_years is None:
        pdf_urls = discover_schedule_pdfs()
        pdf_maps = {}
        pdf_years = {}
        for season, url in pdf_urls.items():
            try:
                pdf_maps[season] = get_csci_381_topic_maps(url)
                m = re.search(r"(\d{2})\.pdf", url)
                pdf_years[season] = "20" + m.group(1) if m else str(pd.Timestamp.now().year)
            except Exception:
                pass

    df = df.copy()

    def update_name(row):
        subj = str(row.get("Subject", "")).strip().upper()
        num = str(row.get("Course Number", "")).strip()
        curr_name = str(row.get("Course Name", "")).strip()

        if subj != "CSCI" or num != "381":
            return curr_name

        term_str = str(row.get("Term", "")).strip()
        sec = str(row.get("Section", "")).strip()
        season, year = get_term_season_year(term_str)

        matched_title = None
        if season in pdf_maps and pdf_years.get(season) == year:
            _, sec_map = pdf_maps[season]
            matched_title = sec_map.get(sec)

        if matched_title:
            return matched_title

        return re.sub(r"^vt:?\s*", "", curr_name, flags=re.IGNORECASE).strip()

    df["Course Name"] = df.apply(update_name, axis=1)
    return df


def sync_database_csci381(dry_run: bool = True):
    """
    Directly inspects and updates CSCI 381 descriptions in Supabase database tables.
    """
    load_dotenv()
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        print("Error: SUPABASE_DB_URL not found in environment.", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(db_url)
    pdf_urls = discover_schedule_pdfs()
    print(f"[*] Discovered {len(pdf_urls)} CS schedule PDFs: {list(pdf_urls.keys())}")

    pdf_maps = {}
    pdf_years = {}
    for season, url in pdf_urls.items():
        print(f"[*] Extracting CSCI 381 topics from {season} PDF: {url}")
        code_map, sec_map = get_csci_381_topic_maps(url)
        pdf_maps[season] = (code_map, sec_map)
        m = re.search(r"(\d{2})\.pdf", url)
        pdf_years[season] = "20" + m.group(1) if m else str(pd.Timestamp.now().year)
        print(f"    Found {len(code_map)} CSCI 381 sections.")

    total_updated = 0

    with engine.begin() as conn:
        for season, target_tables in TERM_TO_TABLES.items():
            if season not in pdf_maps:
                continue

            code_map, sec_map = pdf_maps[season]

            for table in target_tables:
                check_table = conn.execute(
                    text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :tbl)"),
                    {"tbl": table}
                ).scalar()

                if not check_table:
                    continue

                select_q = text(
                    f'SELECT "Sec", "Code", "Course (hr, crd)", "Description" '
                    f'FROM "{table}" WHERE "Course (hr, crd)" ILIKE :pat'
                )
                rows = conn.execute(select_q, {"pat": "CSCI 381%"}).fetchall()
                print(f"\n[*] Table '{table}': {len(rows)} CSCI 381 sections found in DB.")

                for r in rows:
                    sec = str(r[0]).strip()
                    code = str(r[1]).strip()
                    curr_desc = str(r[3]).strip()

                    matched_title = code_map.get(code) or sec_map.get(sec)
                    if matched_title:
                        new_desc = matched_title
                        if curr_desc != new_desc:
                            print(f"    UPDATE [{table}] Code {code} (Sec {sec}): '{curr_desc}' -> '{new_desc}'")
                            total_updated += 1
                            if not dry_run:
                                update_q = text(
                                    f'UPDATE "{table}" SET "Description" = :new_desc, "last_updated" = NOW() '
                                    f'WHERE "Code" = :code'
                                )
                                conn.execute(update_q, {"new_desc": new_desc, "code": code})
                        else:
                            print(f"    ALREADY UP TO DATE [{table}] Code {code}: '{curr_desc}'")
                    else:
                        print(f"    NO MATCH in PDF for [{table}] Code {code} (Sec {sec})")

        check_ig = conn.execute(
            text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructor_grades')")
        ).scalar()

        if check_ig:
            ig_rows = conn.execute(
                text(
                    'SELECT "Term", "Section", "Course Name", "Instructor" '
                    'FROM "instructor_grades" '
                    'WHERE "Subject" = :subj AND "Course Number" = :num'
                ),
                {"subj": "CSCI", "num": "381"},
            ).fetchall()
            print(f"\n[*] Table 'instructor_grades': {len(ig_rows)} CSCI 381 sections found in DB.")

            for r in ig_rows:
                term = str(r[0]).strip()
                sec = str(r[1]).strip()
                curr_name = str(r[2]).strip()
                inst = str(r[3]).strip()

                season, year = get_term_season_year(term)
                matched_title = None
                if season in pdf_maps and pdf_years.get(season) == year:
                    _, sec_map = pdf_maps[season]
                    matched_title = sec_map.get(sec)

                new_name = matched_title if matched_title else re.sub(r"^vt:?\s*", "", curr_name, flags=re.IGNORECASE).strip()

                if curr_name != new_name:
                    print(f"    UPDATE [instructor_grades] Term {term} Sec {sec} ({inst}): '{curr_name}' -> '{new_name}'")
                    total_updated += 1
                    if not dry_run:
                        update_q = text(
                            'UPDATE "instructor_grades" SET "Course Name" = :new_name, "last_updated" = NOW() '
                            'WHERE "Subject" = :subj AND "Course Number" = :num AND "Term" = :term AND "Section" = :sec AND "Instructor" = :inst'
                        )
                        conn.execute(
                            update_q,
                            {
                                "new_name": new_name,
                                "subj": "CSCI",
                                "num": "381",
                                "term": r[0],
                                "sec": r[1],
                                "inst": r[3],
                            },
                        )
                else:
                    print(f"    ALREADY UP TO DATE [instructor_grades] Term {term} Sec {sec}: '{curr_name}'")

    if dry_run:
        print(f"\n[DRY RUN COMPLETE] {total_updated} rows would be updated in Supabase. (Use --commit to execute)")
    else:
        print(f"\n[SUCCESS] Committed {total_updated} CSCI 381 description updates to Supabase.")


def main():
    parser = argparse.ArgumentParser(description="Enrich CSCI 381 course descriptions from Queens College CS schedule PDFs.")
    parser.add_argument("--commit", action="store_true", help="Apply updates directly to Supabase database.")
    parser.add_argument("--dry-run", action="store_true", help="Perform dry run without committing database changes.")
    args = parser.parse_args()

    sync_database_csci381(dry_run=not args.commit)


if __name__ == "__main__":
    main()
