import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

from get_course_data import get_course_data
from get_grades_data import get_grades_data
from get_professor_summary import get_professor_summary

def sync_table_to_supabase(df, table_name, engine):
    if df is None or df.empty:
        return

    now = pd.Timestamp.now()
    df['created'] = now
    df['last_updated'] = now

    inspector = inspect(engine)
    table_exists = inspector.has_table(table_name)

    with engine.begin() as conn:
        if table_exists:
            conn.execute(text(f'TRUNCATE TABLE "{table_name}" RESTART IDENTITY CASCADE;'))
            mode = 'append'
        else:
            mode = 'fail' 

        df.to_sql(
            table_name, 
            conn, 
            if_exists=mode,
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
            engine=engine
        )

    summary_df = get_professor_summary()
    sync_table_to_supabase(
        df=summary_df, 
        table_name="instructor_course_summary", 
        engine=engine
    )

if __name__ == "__main__":
    main()