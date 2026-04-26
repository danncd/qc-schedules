import os
import pandas as pd
import numpy as np

from sqlalchemy import create_engine, inspect
from get_grades_data import get_grades_data
from extract_grade_counts import extract_grade_counts
from dotenv import load_dotenv

SYNC_KEY_GRADES = 'Instructor'

def upload_grades():
    load_dotenv()
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        raise ValueError("SUPABASE_DB_URL not found in environment variables")
    
    engine = create_engine(db_url)
    inspector = inspect(engine)

    print("Fetching historical grade data...")
    grades_df = get_grades_data()
    
    if grades_df is None or grades_df.empty:
        print("No grade data found to upload.")
        return

    now = pd.Timestamp.now()
    table_name = "instructor_summaries"

    print(f"Starting to sync {table_name}...")

    if SYNC_KEY_GRADES in grades_df.columns:
        grades_df[SYNC_KEY_GRADES] = grades_df[SYNC_KEY_GRADES].astype(str).str.strip()
    
    if inspector.has_table(table_name):
        existing_data = pd.read_sql(f'SELECT "{SYNC_KEY_GRADES}", "created" FROM {table_name}', engine)
        existing_data[SYNC_KEY_GRADES] = existing_data[SYNC_KEY_GRADES].astype(str).str.strip()
        
        existing_lookup = existing_data.drop_duplicates(subset=[SYNC_KEY_GRADES])
        
        merged_df = pd.merge(grades_df, existing_lookup, on=SYNC_KEY_GRADES, how='left')
        
        merged_df['created'] = merged_df['created'].fillna(now)
        final_df = merged_df
    else:
        grades_df['created'] = now
        final_df = grades_df

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
    
    print(f"Successfully updated {table_name} in Supabase!")

def upload_professor_summaries():
    load_dotenv()
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        raise ValueError("SUPABASE_DB_URL not found in environment variables")
    
    engine = create_engine(db_url)
    inspector = inspect(engine)

    print("Fetching historical grades...")
    grades_df = get_grades_data()

    counts_df = grades_df.apply(extract_grade_counts, axis=1)
    grades_df = pd.concat([grades_df, counts_df], axis=1)

    print("Generating professor course summaries...")
    course_summary = grades_df.groupby(["Instructor", "Subject", "Course Number"]).agg({
        "avg gpa": "mean",
        "Total_Students": "sum",
        "Total_W": "sum",
        "Above_F": "sum",
        "Above_D": "sum",
        "Above_C": "sum"
    }).reset_index()

    course_summary["Withdrawal_Rate (%)"] = np.where(
        course_summary["Total_Students"] > 0,
        (course_summary["Total_W"] / course_summary["Total_Students"] * 100).round(2),
        0
    )

    course_summary["Pass_Rate_Strict (%)"] = np.where(
        course_summary["Total_Students"] > 0,
        (course_summary["Above_C"] / course_summary["Total_Students"] * 100).round(2),
        0
    )

    students_who_finished = course_summary["Total_Students"] - course_summary["Total_W"]
    course_summary["Pass_Rate_Effective (%)"] = np.where(
        students_who_finished > 0,
        (course_summary["Above_C"] / students_who_finished * 100).round(2),
        0
    )

    course_summary["avg gpa"] = course_summary["avg gpa"].round(2)

    table_name = "instructor_course_summary"
    now = pd.Timestamp.now()
    
    course_summary[SYNC_KEY_GRADES] = course_summary[SYNC_KEY_GRADES].astype(str).str.strip()

    if inspector.has_table(table_name):
        existing_data = pd.read_sql(f'SELECT "{SYNC_KEY_GRADES}", "created" FROM {table_name}', engine)
        existing_data[SYNC_KEY_GRADES] = existing_data[SYNC_KEY_GRADES].astype(str).str.strip()
        
        existing_lookup = existing_data.drop_duplicates(subset=[SYNC_KEY_GRADES])
        
        merged_df = pd.merge(course_summary, existing_lookup, on=SYNC_KEY_GRADES, how='left')
        merged_df['created'] = merged_df['created'].fillna(now)
        final_df = merged_df
    else:
        course_summary['created'] = now
        final_df = course_summary

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
    
    print(f"Database table: {table_name} updated successfully!")
    return final_df

def main():
    upload_professor_summaries()
    upload_grades()

if __name__ == "__main__":
    main()