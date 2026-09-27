import io
import re
import urllib.request
from dataclasses import dataclass
from urllib.parse import urljoin

import pypdf
from bs4 import BeautifulSoup

BASE_INDEX_URL = "https://www.cs.qc.cuny.edu/index-3.html"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


@dataclass(frozen=True)
class SchedulePDF:
    season: str
    year: int | None
    url: str


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip()


def discover_schedule_pdfs(index_url: str = BASE_INDEX_URL) -> list[SchedulePDF]:
    request = urllib.request.Request(index_url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=20) as response:
        soup = BeautifulSoup(response.read().decode("utf-8"), "html.parser")

    anchor = soup.find("a", attrs={"name": "schedule"})
    links = anchor.find_next("ol") if anchor else None
    if links is None:
        raise ValueError("The department schedule links could not be found.")

    schedules = []
    for link in links.find_all("a", href=True):
        label = (link.get_text(" ", strip=True) or link.get("aria-label", "")).lower()
        season = next(
            (name for name in ("winter", "spring", "summer", "fall") if name in label),
            None,
        )
        if season is None:
            continue

        url = urljoin(index_url, link["href"])
        label_year = re.search(r"\b(20\d{2})\b", label)
        url_year = re.search(
            r"(?:win|sp|su|fa)(\d{2})\.pdf(?:[?#].*)?$", url, re.IGNORECASE
        )
        year = int(label_year.group(1)) if label_year else None
        if url_year:
            file_year = 2000 + int(url_year.group(1))
            if year is not None and year != file_year:
                raise ValueError(
                    f"Conflicting years in department schedule link: {url}"
                )
            year = file_year

        schedules.append(SchedulePDF(season=season, year=year, url=url))

    if not schedules:
        raise ValueError("No department schedule PDFs were found.")
    return schedules


def parse_cs_schedule_pdf(pdf_source: str | bytes) -> list[dict[str, str]]:
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
    courses: list[dict[str, str]] = []

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

            if "Component" in line and "Catalog" in line:
                tokens = line.lower().split()
                has_session = "session" in tokens
                class_idx = tokens.index("class#") if "class#" in tokens else -1
                assoc_idx = tokens.index("assoc") if "assoc" in tokens else -1
                header_layout = {
                    "has_session": has_session,
                    "class_before_assoc": (
                        class_idx < assoc_idx
                        if (class_idx != -1 and assoc_idx != -1)
                        else False
                    ),
                }
                continue

            if re.match(r"^\d+\s+of\s+\d+$", line):
                continue
            if any(
                term_indicator in line
                for term_indicator in [
                    "Winter Session",
                    "Spring 202",
                    "Summer 202",
                    "Fall 202",
                ]
            ):
                continue

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

            if header_layout and header_layout["class_before_assoc"]:
                class_num, assoc = id1, id2
            elif header_layout and not header_layout["class_before_assoc"]:
                assoc, class_num = id1, id2
            else:
                if (
                    len(id1) >= 4
                    and id1.isdigit()
                    and not (len(id2) >= 4 and id2.isdigit())
                ):
                    class_num, assoc = id1, id2
                else:
                    assoc, class_num = id1, id2

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

            courses.append(
                {
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
                }
            )

    return courses


def fetch_topic_courses(terms: set[tuple[str, int]]) -> dict:
    try:
        documents = discover_schedule_pdfs()
    except Exception as error:
        print(
            f"Topic discovery unavailable ({type(error).__name__}); keeping source titles."
        )
        return {}

    topics = {}
    parsed = {}
    for document in documents:
        term = (document.season, document.year)
        if term not in terms:
            continue
        try:
            if document.url not in parsed:
                parsed[document.url] = parse_cs_schedule_pdf(document.url)
            topics.setdefault(term, []).extend(parsed[document.url])
        except Exception as error:
            print(
                f"Topics unavailable for {term[0]} {term[1]} ({type(error).__name__})."
            )
    for season, year in sorted(terms - topics.keys()):
        print(f"No topic PDF for {season} {year}; keeping source titles.")
    return topics
