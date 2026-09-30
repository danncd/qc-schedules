# QC Schedules

**Live at [qcs.danncd.com](https://qcs.danncd.com)**

An unofficial Queens College course lookup built with Next.js, React, TypeScript, and Tailwind CSS. Data is stored in Supabase and updated through Python scripts.

Search by course, instructor, room, or class code. View enrollment, meeting details, and historical instructor grade distributions.

## Running locally

Use Node.js 24 and an existing QC Schedules Supabase database.

Inside `frontend/`, copy `.env.example` to `.env.local` and fill in the Supabase URL and public key.

```sh
cd frontend
npm ci
npm run dev
```

Open [localhost:3005](http://localhost:3005).

To build and run the production version:

```sh
npm run build
npm start
```

## Updating data

Use Python 3.12. From the repository root:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
```

Preview the imported data without writing to the database:

```sh
python -m scripts.sync_schedule
python -m scripts.sync_grades
```

Schedule imports read the default year and every newer year offered by QC’s year selector. Terms explicitly reported as unpublished are skipped, preserving any existing database data. Use `--year 2027` to import just one year.

To save changes, copy the root `.env.example` to `.env`, set `SUPABASE_DB_URL`, and add `--commit` to either command.

GitHub Actions schedules course imports every four hours and grade imports weekly. These workflows use the `SUPABASE_DB_URL` repository secret.

## Project structure

```text
frontend/src/
    app/            Pages and routing
    components/     Shared interface components
    features/       Schedules, instructors, and grades
    lib/            Shared utilities and database access
    styles/         Theme and component styles

scripts/
    sources/        Fetching source data
    transforms/     Cleaning and preparing records
    database/       Database connections and synchronization
    tests/          Import and database tests
```

## Checks

From `frontend/`:

```sh
npm test
npm run lint
npm run typecheck
npm run format:check
```

From the repository root, with the Python environment activated:

```sh
python -m unittest discover -s scripts/tests
```
