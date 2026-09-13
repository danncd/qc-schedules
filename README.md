# QC Schedules

Live site: **https://qcs.danncd.com**

An unofficial course explorer for Queens College (CUNY). It puts the current class schedule next to historical grade distributions, so you can look up a course, see who is teaching it, and check how those sections have actually graded before you register.

QC's own course search only shows the current schedule and exposes no grade history at all. This pulls both together and keeps them updated on a schedule.

## Stack

Frontend
- Next.js 16 (App Router) and React 19, TypeScript
- Tailwind CSS 4
- `@supabase/supabase-js` and `@supabase/ssr` for reads
- Deployed on Vercel

Pipeline
- Python 3.11
- Playwright to drive the course search
- pandas for cleaning and aggregation
- SQLAlchemy and psycopg2 for Postgres writes
- pypdf and BeautifulSoup for the CS department PDFs

Database
- Supabase (Postgres), read by the frontend through RLS with the public anon key

## How it works

Three sources feed in, and one script writes the result to Supabase.

**Course schedules.** `scripts/get_course_data.py` drives headless Chromium through the QC course search and pulls the results table for each semester (winter, spring, summer 1, summer 2, fall), then parses it with `pd.read_html`. The search form is an ASP.NET postback, so there is no URL to hit directly. The script selects the term, clicks the button, and waits on the resulting response and table selector.

**Grade distributions.** `scripts/get_grades_data.py` downloads an Excel export of a Google Sheets workbook containing per-section grade counts (A+ through F, plus W, P and INC), normalizes the inconsistent column names across tabs, and drops placeholder instructors like `STAFF`, `TBA` and `0`. `scripts/get_professor_summary.py` then aggregates that into per-instructor, per-course stats.

**CSCI 381/780 special topics.** The registrar data only ever says "SPECIAL TOPICS" for these sections. `scripts/enrich_csci381.py` scrapes the CS department schedule PDFs and swaps in the real topic titles. This is also where the `VT:` / `SCS:` / `SCM:` prefixes get stripped off descriptions.

`scripts/upload_data.py` is the entry point. It runs whichever pipeline you ask for and syncs the result.

### GPA math

The source data does not always carry a usable average, so GPA is computed from the raw letter counts using standard weights (A+ = 4.0 down to F = 0.0), weighted by the number of graded students. Older rows that have no letter breakdown but do have an `avg gpa` value fall back to `avg gpa * (Total - W)` so they still contribute.

Two pass rates are stored because they answer different questions:

- Strict: C or better, out of everyone enrolled
- Effective: C or better, out of students who did not withdraw

## Supabase schema

Semester tables are named `<season>_<year>`, for example `spring_2026` or `summer_1_2026`. The frontend does not hardcode that list. It calls the `get_tables_by_year(year_text)` RPC at request time, so a new semester shows up as soon as its table exists.

| Table | Primary key |
| --- | --- |
| `<season>_<year>` | `Code` |
| `instructor_grades` | `Term`, `Subject`, `Course Number`, `Section`, `Instructor` |
| `instructor_course_summary` | `Instructor`, `Subject`, `Course Number` |

`get_tables_by_year` is a Postgres function that must already exist in the Supabase project. It is not defined in this repo.

### How the sync writes

Each table is fully refreshed. The sync reads the existing `created` timestamps, merges them onto the new frame so first-seen dates survive, runs `TRUNCATE ... RESTART IDENTITY CASCADE`, then bulk inserts. The truncate and the insert share one transaction, so readers never see a half-empty table.

On first creation of a table it also grants `SELECT` to `anon`, enables row level security, and adds a public read policy. Existing tables keep whatever policies they already have.

## Running the pipeline locally

Python 3.11 or newer.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install --with-deps chromium   # only needed for the schedule sync
```

Create a `.env` in the repo root (see `.env.example`):

```
SUPABASE_DB_URL=postgresql://...
```

That is the Postgres connection string from Supabase (Project Settings > Database), not the REST URL.

```bash
python scripts/upload_data.py --schedule    # course schedules only
python scripts/upload_data.py --grades      # grades and professor summaries only
python scripts/upload_data.py --all         # both
python scripts/upload_data.py --enrich-csci # refresh CSCI 381/780 topic titles
```

With no flags it syncs both. The grades half comes from a public Google Sheets export, so it needs no credentials of its own.

`enrich_csci381.py` also runs standalone and defaults to a dry run:

```bash
python scripts/enrich_csci381.py          # dry run, prints what would change
python scripts/enrich_csci381.py --commit # write to Supabase
```

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

It needs `frontend/.env.local` (see `frontend/.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Either `NEXT_PUBLIC_SUPABASE_ANON_KEY` or the newer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` works. Both are read in `frontend/src/_utils/supabase/server.ts`.

Pages are statically rendered with ISR at `revalidate = 14400`, which matches the schedule sync interval. The sitemap revalidates daily.

## Automation

Two GitHub Actions workflows keep the data current. Both need a `SUPABASE_DB_URL` repository secret, and both can be triggered manually from the Actions tab.

| Workflow | Schedule |
| --- | --- |
| `.github/workflows/sync_schedule.yml` | Every 4 hours (`0 */4 * * *`) |
| `.github/workflows/sync_grades.yml` | Sundays at 03:00 UTC (`0 3 * * 0`) |

## Notes

- Run the scripts as file paths from the repo root, like `python scripts/upload_data.py`. They import each other as top-level modules, so `python -m scripts.upload_data` will not resolve those imports.
- Both `.gitignore` files ignore `.env*`. `.env.example` is explicitly un-ignored in each so the templates stay in the repo.
- Instructor names are messy across sources. The instructor directory matches on last name plus first initial and uses the current schedule to recover a full name, falling back to a formatted `LAST, I.` when there is no match. See `frontend/src/_utils/slugs.ts` and `getInstructorDirectory` in `frontend/src/_utils/server.ts`.
- The schedule sync is the only part that needs Chromium. Everything else is plain HTTP and pandas.

## Disclaimer

This project is not affiliated with or endorsed by Queens College or CUNY. Course and grade data belongs to CUNY and is republished here for students' convenience. The scrapers only touch public pages and run on a fixed schedule to keep load on the source servers low.
