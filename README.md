# QC Schedules

**Live at [qcs.danncd.com](https://qcs.danncd.com)**

A course explorer for Queens College (CUNY). It puts the current class schedule next to historical grade distributions, so you can check how a course has actually graded before you register. The college's own search shows the current schedule and nothing else.

<!--
Drop a screenshot in before anything else. Delete this comment and add:
![Scheduling a semester on QC Schedules](docs/screenshot.png)
-->

## How the data gets there

Three sources feed a Python pipeline that writes to Postgres; the frontend only reads.

**Schedules** are scraped from the QC course search with Playwright. It is an ASP.NET postback with no addressable URL, so the script selects each of the five terms, clicks, and waits on the resulting response and table selector.

**Grades** come from an Excel export of a Google Sheets workbook holding per-section grade counts. Column names differ between tabs and the instructor field carries junk like `STAFF` and `TBA`, so the pipeline normalizes and filters before aggregating per instructor and course.

**Special topics** for CSCI 381 and 780 come from the CS department's schedule PDFs, since the registrar data says only "SPECIAL TOPICS". The `VT:` / `SCS:` / `SCM:` prefixes get stripped here too.

`scripts/upload_data.py` runs whichever pipeline you ask for and syncs the result.

## Engineering notes

- **GPA is recomputed from raw letter counts**, weighted by graded students, because the source average is not always usable. Rows with no letter breakdown fall back to `avg gpa * (Total - W)` rather than reading as zero.
- **Two pass rates**, because they answer different questions: strict (C or better out of everyone enrolled) and effective (C or better out of students who did not withdraw).
- **The sync is atomic and idempotent.** Existing `created` timestamps are merged onto the new frame so first-seen dates survive, then truncate and insert share one transaction, so readers never see a half-empty table. RLS with a public read policy is applied at creation and never clobbered.
- **The frontend does not hardcode the semester list.** It asks a `get_tables_by_year` RPC which tables exist, and renders with ISR at `revalidate = 14400` to match the sync interval.
- **Instructor names are messy across sources.** `KIRSCHNER, D` and `Kirschner, David` are one person, so the directory matches on last name plus first initial and recovers the full name from the current schedule.

Stack: Next.js 16, React 19, TypeScript, Tailwind 4 and Supabase; Python 3.11, Playwright, pandas, SQLAlchemy and pypdf. Vercel serves the site, GitHub Actions runs the pipeline.

## Running it locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install --with-deps chromium   # schedule sync only
```

Create `.env` in the repo root (see `.env.example`) with `SUPABASE_DB_URL`, the Postgres connection string from Supabase rather than the REST URL.

```bash
python scripts/upload_data.py --all   # --schedule, --grades, --enrich-csci run one part
```

Grade data comes from a public Sheets export, so it needs no credentials. The frontend needs `frontend/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and a public key (see `frontend/.env.example`), then `cd frontend && npm install && npm run dev`.

Sync runs on GitHub Actions: schedules every 4 hours, grades Sundays at 03:00 UTC. Both need a `SUPABASE_DB_URL` secret.

## Notes

- Run the scripts as file paths from the repo root. They import each other as top-level modules, so `python -m scripts.upload_data` will not resolve those imports.
- `get_tables_by_year` is a Postgres function that must exist in the Supabase project. It is not in this repo.

## Disclaimer

Not affiliated with or endorsed by Queens College or CUNY. Course and grade data belongs to CUNY and is republished for students' convenience. Scrapers touch only public pages and run on a fixed schedule to keep load low.
