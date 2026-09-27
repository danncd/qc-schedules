import io

import pandas as pd
import requests

SHEET_ID = "1mS6khEB6m8cPNenNvY9Tg6bJ6YkmcvCI"
WORKBOOK_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx"


def fetch_grade_sheets() -> dict[str, pd.DataFrame]:
    response = requests.get(WORKBOOK_URL, timeout=120)
    response.raise_for_status()
    return pd.read_excel(
        io.BytesIO(response.content),
        sheet_name=None,
        engine="openpyxl",
    )
