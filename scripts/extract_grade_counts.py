import pandas as pd

GRADE_WEIGHTS = {
    "a+": 4.0, "a": 4.0, "a-": 3.7,
    "b+": 3.3, "b": 3.0, "b-": 2.7,
    "c+": 2.3, "c": 2.0, "c-": 1.7,
    "d+": 1.3, "d": 1.0,
    "f": 0.0
}

GRADE_COLUMNS = list(GRADE_WEIGHTS.keys())

def safe_num(val):
    num = pd.to_numeric(val, errors="coerce")
    return 0.0 if pd.isna(num) else float(num)

def extract_grade_counts(row):
    total = safe_num(row.get("Total", 0))
    w = safe_num(row.get("w", 0))
    p = safe_num(row.get("p", 0))
    
    grade_map = {col: safe_num(row.get(col, 0)) for col in GRADE_COLUMNS}

    # Graded students are those who received standard letter grades (A+ through F)
    graded_students = sum(grade_map.values())
    quality_points = sum(grade_map[col] * weight for col, weight in GRADE_WEIGHTS.items())

    # Passing grades: C or better
    above_c = sum(grade_map[col] for col in ["a+", "a", "a-", "b+", "b", "b-", "c+", "c"])
    
    # Passing grades: D or better (includes 'd' and 'd+')
    above_d = sum(grade_map[col] for col in ["a+", "a", "a-", "b+", "b", "b-", "c+", "c", "c-", "d+", "d"])
    
    # Passing grades above F: All passing letter grades plus P (credit/pass)
    above_f = above_d + p

    return pd.Series({
        "Total_Students": total,
        "Total_W": w,
        "Graded_Students": graded_students,
        "Quality_Points": quality_points,
        "Above_F": above_f,
        "Above_D": above_d,
        "Above_C": above_c
    })