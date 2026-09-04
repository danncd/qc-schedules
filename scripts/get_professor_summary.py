import pandas as pd
import numpy as np

from get_grades_data import get_grades_data

GRADE_WEIGHTS = {
    "a+": 4.0, "a": 4.0, "a-": 3.7,
    "b+": 3.3, "b": 3.0, "b-": 2.7,
    "c+": 2.3, "c": 2.0, "c-": 1.7,
    "d+": 1.3, "d": 1.0,
    "f": 0.0
}

GRADE_COLUMNS = list(GRADE_WEIGHTS.keys())
C_OR_BETTER = ["a+", "a", "a-", "b+", "b", "b-", "c+", "c"]
PASSING_GRADES = ["a+", "a", "a-", "b+", "b", "b-", "c+", "c", "c-", "d+", "d"]

def get_professor_summary(grades_df: pd.DataFrame = None) -> pd.DataFrame:
    if grades_df is None:
        grades_df = get_grades_data()

    print("Generating professor course summaries with weighted metrics...")
    df = grades_df.copy()

    # Ensure all numeric columns are cleanly converted
    for col in GRADE_COLUMNS + ["Total", "w", "p", "inc"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
        else:
            df[col] = 0.0

    df["raw_avg_gpa"] = pd.to_numeric(df.get("avg gpa", 0.0), errors="coerce").fillna(0.0)

    # Vectorized calculation of quality points and grade buckets per row
    df["quality_points"] = sum(df[grade] * weight for grade, weight in GRADE_WEIGHTS.items())
    df["Graded_Students"] = sum(df[grade] for grade in GRADE_COLUMNS)
    df["Above_C"] = sum(df[grade] for grade in C_OR_BETTER)
    df["Above_D"] = sum(df[grade] for grade in PASSING_GRADES)
    df["Above_F"] = df["Above_D"] + df["p"]
    df["Total_Students"] = df["Total"]
    df["Total_W"] = df["w"]

    # Fallback for historical rows where letter grades might be 0 but raw_avg_gpa > 0
    fallback_mask = (df["Graded_Students"] == 0) & (df["raw_avg_gpa"] > 0)
    fallback_finished = (df["Total_Students"] - df["Total_W"]).clip(lower=0)
    df.loc[fallback_mask, "quality_points"] = df.loc[fallback_mask, "raw_avg_gpa"] * fallback_finished
    df.loc[fallback_mask, "Graded_Students"] = fallback_finished

    # Aggregate by Professor & Course
    course_summary = df.groupby(["Instructor", "Subject", "Course Number"]).agg({
        "quality_points": "sum",
        "Graded_Students": "sum",
        "Total_Students": "sum",
        "Total_W": "sum",
        "Above_F": "sum",
        "Above_D": "sum",
        "Above_C": "sum"
    }).reset_index()

    # Calculate student-weighted GPA (0-graded sections contribute 0 weight)
    course_summary["avg gpa"] = np.where(
        course_summary["Graded_Students"] > 0,
        (course_summary["quality_points"] / course_summary["Graded_Students"]).round(2),
        0.0
    )

    # Calculate rates
    students_who_finished = (course_summary["Total_Students"] - course_summary["Total_W"]).clip(lower=0)

    course_summary["Withdrawal_Rate (%)"] = np.where(
        course_summary["Total_Students"] > 0,
        (course_summary["Total_W"] / course_summary["Total_Students"] * 100).clip(0, 100).round(2),
        0.0
    )

    course_summary["Pass_Rate_Strict (%)"] = np.where(
        course_summary["Total_Students"] > 0,
        (course_summary["Above_C"] / course_summary["Total_Students"] * 100).clip(0, 100).round(2),
        0.0
    )

    course_summary["Pass_Rate_Effective (%)"] = np.where(
        students_who_finished > 0,
        (course_summary["Above_C"] / students_who_finished * 100).clip(0, 100).round(2),
        0.0
    )

    # Drop temporary calculation columns before returning
    course_summary = course_summary.drop(columns=["quality_points", "Graded_Students"])

    print(f"Generated {len(course_summary)} professor course summaries.")
    return course_summary

if __name__ == "__main__":
    course_summary = get_professor_summary()
    course_summary.to_csv("professor_summaries.csv", index=False)