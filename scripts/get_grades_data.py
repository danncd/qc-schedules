import io
import pandas as pd
import requests

def get_grades_data():
    SHEET_ID = "1mS6khEB6m8cPNenNvY9Tg6bJ6YkmcvCI"
    EXCEL_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx"


    column_map = {
        'term name': 'Term', 'term': 'Term',
        'subject': 'Subject',
        'nbr': 'Course Number', 'catalog nbr': 'Course Number', 'course number': 'Course Number',
        'crs descr': 'Course Name', 'course name': 'Course Name', 'course description': 'Course Name', 'description': 'Course Name',
        'class section': 'Section', 'section': 'Section',
        'prof': 'Instructor', 'instructor': 'Instructor',
        'total': 'Total', 'total enrl': 'Total', 'total enrolled': 'Total', 'total enrollment': 'Total',
        
        'average gpa': 'avg gpa', 'avg gpa': 'avg gpa',
        'fail': 'f', 'f': 'f',
        'withdrawal': 'w', 'withdraw': 'w', 'w': 'w',
        'inc/na': 'inc', 'inc/no grade': 'inc', 'incomplete': 'inc', 'inc': 'inc'
    }

    try:
        response = requests.get(EXCEL_URL, timeout=30)
        response.raise_for_status()

        all_sheets_dict = pd.read_excel(io.BytesIO(response.content), sheet_name=None, engine='openpyxl')
        
        print(f"Found {len(all_sheets_dict)} tabs.")

        all_dataframes = []

        for tab_name, df in all_sheets_dict.items():
            df.columns = [str(col).lower().strip() for col in df.columns]

            if df.columns[0] == '0':
                df.columns.values[0] = 'term'

            df = df.rename(columns=column_map)
            df['Term'] = tab_name

            all_dataframes.append(df)

        master_df = pd.concat(all_dataframes, ignore_index=True)
        master_df = master_df.dropna(how='all')

        master_df = master_df[master_df['Term'] != 'COMBINED_OLD Pre-Fall19']
        
        if 'Instructor' in master_df.columns and 'Subject' in master_df.columns:
            master_df = master_df.dropna(subset=['Instructor', 'Subject'])

        if 'Instructor' in master_df.columns:
            master_df['Instructor'] = master_df['Instructor'].astype(str).str.strip().str.upper()
            master_df = master_df[~master_df['Instructor'].isin(['NAN', 'STAFF', 'NONE', ''])]

        if 'Subject' in master_df.columns:
            master_df['Subject'] = master_df['Subject'].astype(str).str.strip().str.upper()

        if 'Course Number' in master_df.columns:
            master_df['Course Number'] = master_df['Course Number'].astype(str).str.strip().str.upper()

        print(f"Dataset combined and cleaned into {len(master_df)} rows.")
        
        return master_df

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    grades_df = get_grades_data()
    grades_df.to_csv("grade.csv")