import argparse
import os
import sys
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text



def sync_table_to_supabase(df, table_name, engine, sync_key):
    if df is None or df.empty:
        print(f"No data to sync for '{table_name}'. Skipping.")
        return

    # Clean out unnamed or artifact columns
    df = df.loc[:, ~df.columns.astype(str).str.contains(r"^Unnamed|^0\.0$")].copy()

    sync_keys = [sync_key] if isinstance(sync_key, str) else list(sync_key)
    now = pd.Timestamp.now()
    inspector = inspect(engine)

    # Ensure sync key columns are stripped strings
    for k in sync_keys:
        if k in df.columns:
            df[k] = df[k].astype(str).str.strip()

    # Deduplicate in-memory by primary key
    df = df.drop_duplicates(subset=sync_keys)

    table_exists = inspector.has_table(table_name)

    if table_exists:
        # Check which sync columns exist in the remote table
        cols_query = ", ".join([f'"{k}"' for k in sync_keys] + ['"created"'])
        try:
            existing_data = pd.read_sql(f'SELECT {cols_query} FROM "{table_name}"', engine)
            for k in sync_keys:
                existing_data[k] = existing_data[k].astype(str).str.strip()
            existing_lookup = existing_data.drop_duplicates(subset=sync_keys)
            
            final_df = pd.merge(df, existing_lookup, on=sync_keys, how='left')
            final_df['created'] = final_df['created'].fillna(now)
        except Exception as e:
            print(f"Warning: Could not preserve created timestamps for {table_name}: {e}")
            final_df = df.copy()
            final_df['created'] = now
    else:
        final_df = df.copy()
        final_df['created'] = now

    final_df['last_updated'] = now

    print(f"Uploading {len(final_df)} rows to '{table_name}'...")

    with engine.begin() as conn:
        if table_exists:
            conn.execute(text(f'TRUNCATE TABLE "{table_name}" RESTART IDENTITY CASCADE;'))
        
        final_df.to_sql(
            table_name, 
            conn, 
            if_exists='append',
            index=False,
            method='multi',
            chunksize=1000
        )
        
        # Only configure permissions and RLS if the table was newly created
        if not table_exists:
            conn.execute(text(f'GRANT SELECT ON "{table_name}" TO anon, authenticated;'))
            conn.execute(text(f'ALTER TABLE "{table_name}" ENABLE ROW LEVEL SECURITY;'))
            conn.execute(text(f'CREATE POLICY "Enable public read" ON "{table_name}" AS PERMISSIVE FOR SELECT TO public USING (true);'))

    print(f"Successfully synced and secured '{table_name}'.")

def sync_schedule(engine):
    print("\n=== Syncing Schedule Data ===")
    from get_course_data import get_course_data
    from enrich_csci381 import enrich_all_schedules, sync_database_csci381

    schedule_dfs = get_course_data()
    schedule_dfs = enrich_all_schedules(schedule_dfs)

    for semester_name, new_df in schedule_dfs.items():
        sync_table_to_supabase(
            df=new_df, 
            table_name=semester_name, 
            engine=engine, 
            sync_key='Code'
        )

    sync_database_csci381(dry_run=False)

def sync_grades(engine):
    print("\n=== Syncing Instructor Grades & Summaries ===")
    from get_grades_data import get_grades_data
    from get_professor_summary import get_professor_summary
    from enrich_csci381 import enrich_grades_df, sync_database_csci381

    grades_df = get_grades_data()
    grades_df = enrich_grades_df(grades_df)
    
    sync_table_to_supabase(
        df=grades_df,
        table_name="instructor_grades",
        engine=engine,
        sync_key=['Term', 'Subject', 'Course Number', 'Section', 'Instructor']
    )

    summary_df = get_professor_summary(grades_df)
    sync_table_to_supabase(
        df=summary_df, 
        table_name="instructor_course_summary", 
        engine=engine, 
        sync_key=['Instructor', 'Subject', 'Course Number']
    )

    sync_database_csci381(dry_run=False)

def main():
    parser = argparse.ArgumentParser(description="Sync QC course schedules and instructor grades to Supabase.")
    parser.add_argument("--schedule", action="store_true", help="Sync only current course schedules")
    parser.add_argument("--grades", action="store_true", help="Sync only instructor grades and course summaries")
    parser.add_argument("--all", action="store_true", help="Sync both schedule and instructor grades")
    parser.add_argument("--enrich-csci", action="store_true", help="Enrich CSCI 381 special topics in current database tables")
    args = parser.parse_args()

    load_dotenv()
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        raise ValueError("SUPABASE_DB_URL not found in environment variables")
    
    engine = create_engine(db_url)

    if args.enrich_csci:
        from enrich_csci381 import sync_database_csci381
        sync_database_csci381(dry_run=False)
        return

    # Default to syncing all if neither is specified
    run_schedule = args.schedule or args.all or (not args.schedule and not args.grades)
    run_grades = args.grades or args.all or (not args.schedule and not args.grades)

    if run_schedule:
        sync_schedule(engine)
    if run_grades:
        sync_grades(engine)

    print("\nSync completed successfully!")

if __name__ == "__main__":
    main()