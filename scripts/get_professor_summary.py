import pandas as pd
import numpy as np

from get_grades_data import get_grades_data
from extract_grade_counts import extract_grade_counts

def get_professor_summary():
    grades_df = get_grades_data()

    counts_df = grades_df.apply(extract_grade_counts, axis=1)
    grades_df = pd.concat([grades_df, counts_df], axis=1)

    grades_df["avg gpa"] = pd.to_numeric(
        grades_df["avg gpa"],
        errors="coerce"
    )

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

    return course_summary

if __name__ == "__main__":
    course_summary = get_professor_summary()
    course_summary.to_csv("professor_summaries.csv", index=False)