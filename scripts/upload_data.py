import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

from get_course_data import get_course_data
from get_grades_data import get_grades_data
from get_professor_summary import get_professor_summary

def sync_table_to_supabase(df, table_name, engine, sync_key):
    if df is None or df.empty:
        return

    now = pd.Timestamp.now()
    inspector = inspect(engine)

    if sync_key in df.columns:
        df[sync_key] = df[sync_key].astype(str).str.strip()

    if inspector.has_table(table_name):
        existing_data = pd.read_sql(f'SELECT "{sync_key}", "created" FROM "{table_name}"', engine)
        existing_data[sync_key] = existing_data[sync_key].astype(str).str.strip()
        existing_lookup = existing_data.drop_duplicates(subset=[sync_key])
        
        final_df = pd.merge(df, existing_lookup, on=sync_key, how='left')
        final_df['created'] = final_df['created'].fillna(now)
    else:
        final_df = df.copy()
        final_df['created'] = now

    final_df['last_updated'] = now

    with engine.begin() as conn:
        if inspector.has_table(table_name):
            conn.execute(text(f'TRUNCATE TABLE "{table_name}" RESTART IDENTITY CASCADE;'))
        
        final_df.to_sql(
            table_name, 
            conn, 
            if_exists='append',
            index=False,
            method='multi',
            chunksize=1000
        )
        
        conn.execute(text(f'GRANT SELECT ON "{table_name}" TO anon, authenticated;'))
        conn.execute(text(f'ALTER TABLE "{table_name}" ENABLE ROW LEVEL SECURITY;'))
        conn.execute(text(f'DROP POLICY IF EXISTS "Enable public read" ON "{table_name}";'))
        conn.execute(text(f'CREATE POLICY "Enable public read" ON "{table_name}" AS PERMISSIVE FOR SELECT TO public USING (true);'))

def main():
    load_dotenv()
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        raise ValueError("SUPABASE_DB_URL not found in environment variables")
    
    engine = create_engine(db_url)

    schedule_dfs = get_course_data()
    for semester_name, new_df in schedule_dfs.items():
        if 'Unnamed: 11' in new_df.columns:
            new_df = new_df.drop(columns=['Unnamed: 11'])
            
        sync_table_to_supabase(
            df=new_df, 
            table_name=semester_name, 
            engine=engine, 
            sync_key='Code'
        )

    summary_df = get_professor_summary()
    sync_table_to_supabase(
        df=summary_df, 
        table_name="instructor_course_summary", 
        engine=engine, 
        sync_key='Instructor'
    )

if __name__ == "__main__":
    main()