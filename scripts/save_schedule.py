import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect
from get_course_data import get_course_data

SYNC_KEY_SCHEDULE = 'Code'

def upload_schedules():
    load_dotenv()
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        raise ValueError("SUPABASE_DB_URL not found in environment variables")
    
    engine = create_engine(db_url)
    inspector = inspect(engine)

    schedule_dfs = get_course_data()
    now = pd.Timestamp.now()

    print("Starting to sync Schedules...")

    for semester_name, new_df in schedule_dfs.items():
        table_name = semester_name.lower().replace(" ", "_")

        if 'Unnamed: 11' in new_df.columns:
            new_df = new_df.drop(columns=['Unnamed: 11'])
        
        new_df[SYNC_KEY_SCHEDULE] = new_df[SYNC_KEY_SCHEDULE].astype(str).str.strip()

        if inspector.has_table(table_name):
            existing_data = pd.read_sql(f'SELECT "{SYNC_KEY_SCHEDULE}", "created" FROM {table_name}', engine)
            existing_data[SYNC_KEY_SCHEDULE] = existing_data[SYNC_KEY_SCHEDULE].astype(str).str.strip()
            
            existing_lookup = existing_data.drop_duplicates(subset=[SYNC_KEY_SCHEDULE])
            
            merged_df = pd.merge(new_df, existing_lookup, on=SYNC_KEY_SCHEDULE, how='left')
            
            merged_df['created'] = merged_df['created'].fillna(now)
            final_df = merged_df
        else:
            new_df['created'] = now
            final_df = new_df

        final_df['last_updated'] = now

        print(f"Syncing {table_name}: Uploading {len(final_df)} rows...")
        
        final_df.to_sql(
            table_name, 
            engine, 
            if_exists='replace', 
            index=False,
            method='multi',
            chunksize=1000
        )
    
    print("Database updated successfully!")

def main():
    upload_schedules()

if __name__ == "__main__":
    main()