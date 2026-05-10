import pandas as pd

grade_columns = ["a+", "a", "a-", "b+", "b", "b-", "c+", "c", "c-", "d+", "d", "f"]

def extract_grade_counts(row):
    total = pd.to_numeric(row.get("Total", 0), errors="coerce") or 0
    w = pd.to_numeric(row.get("w", 0), errors="coerce") or 0
    
    grades = [pd.to_numeric(row.get(col, 0), errors="coerce") or 0 for col in grade_columns]
    grade_map = dict(zip(grade_columns, grades))

    above_f = total - grade_map["f"]
    above_d = sum(grade_map[col] for col in ["a+", "a", "a-", "b+", "b", "b-", "c+", "c", "c-", "d+"])
    above_c = sum(grade_map[col] for col in ["a+", "a", "a-", "b+", "b", "b-", "c+", "c"])

    return pd.Series({
        "Total_Students": total,
        "Total_W": w,
        "Above_F": above_f,
        "Above_D": above_d,
        "Above_C": above_c
    })