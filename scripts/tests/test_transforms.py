import unittest

import pandas as pd

from scripts.transforms.grades import normalize_grades
from scripts.transforms.instructor_summaries import build_instructor_summaries
from scripts.transforms.schedules import normalize_schedule
from scripts.transforms.topics import enrich_grades, enrich_schedule


class TransformTests(unittest.TestCase):
    def grade_sheet(self):
        return pd.DataFrame(
            [
                {
                    "prof": "Doe, J",
                    "subject": "csci",
                    "nbr": 381.0,
                    "class section": "01",
                    "description": "Topics",
                    "total": 10,
                    "a": 10,
                    "b": 0,
                    "w": 0,
                    "avg gpa": 4.0,
                },
                {
                    "prof": "Doe, J",
                    "subject": "csci",
                    "nbr": 381.0,
                    "class section": "02",
                    "description": "Topics",
                    "total": 30,
                    "a": 0,
                    "b": 30,
                    "w": 0,
                    "avg gpa": 3.0,
                },
            ]
        )

    def test_duplicates_do_not_inflate_summary(self):
        sheet = self.grade_sheet()
        original = sheet.copy(deep=True)
        grades = normalize_grades({"Spring 2026": pd.concat([sheet, sheet.iloc[:1]])})
        summary = build_instructor_summaries(grades).iloc[0]
        self.assertEqual(len(grades), 2)
        self.assertEqual(summary["Total_Students"], 40)
        self.assertEqual(summary["avg gpa"], 3.25)
        pd.testing.assert_frame_equal(sheet, original)

    def test_conflicting_duplicates_raise(self):
        sheet = self.grade_sheet()
        conflict = sheet.iloc[:1].copy()
        conflict["total"] = 20
        with self.assertRaisesRegex(ValueError, "Conflicting grade records"):
            normalize_grades({"Spring 2026": pd.concat([sheet, conflict])})

    def test_historical_sheets_without_instructors_are_excluded(self):
        sheets = {
            "s2017": self.grade_sheet().drop(columns="prof"),
            "Spring 2026": self.grade_sheet(),
        }
        result = normalize_grades(sheets)
        self.assertEqual(len(result), 2)
        self.assertEqual(set(result["Term"]), {"Spring 2026"})

    def test_numeric_term_header_is_not_kept_as_extra_column(self):
        sheet = self.grade_sheet()
        sheet[0] = "old term"
        result = normalize_grades({"s2019": sheet})
        self.assertNotIn("0", result.columns)
        self.assertEqual(set(result["Term"]), {"s2019"})

    def test_missing_columns_raise(self):
        with self.assertRaisesRegex(ValueError, "missing columns"):
            normalize_grades({"Spring 2026": self.grade_sheet().drop(columns="prof")})

    def test_placeholder_instructors_removed(self):
        sheet = self.grade_sheet()
        sheet.loc[0, "prof"] = "STAFF"
        self.assertEqual(len(normalize_grades({"Spring 2026": sheet})), 1)

    def test_schedule_keeps_distinct_meetings(self):
        rows = pd.DataFrame(
            [
                {
                    "Code": 12345.0,
                    "Sec": "01",
                    "Course (hr, crd)": "CSCI 381",
                    "Description": "Topics",
                    "Day": day,
                }
                for day in ["Monday", "Wednesday", "Monday"]
            ]
        )
        result = normalize_schedule(rows)
        self.assertEqual(len(result), 2)
        self.assertEqual(result.iloc[0]["Code"], "12345")

    def test_topics_require_same_year(self):
        topics = {
            ("spring", 2027): [
                {
                    "catalog": "381",
                    "class_num": "12345",
                    "section": "01",
                    "title": "VT: Adv Python",
                }
            ]
        }
        rows = pd.DataFrame(
            [
                {
                    "Code": "12345",
                    "Sec": "01",
                    "Course (hr, crd)": "CSCI 381",
                    "Description": "Topics",
                }
            ]
        )
        pd.testing.assert_frame_equal(
            enrich_schedule(rows, "spring_2026", topics), rows
        )
        self.assertEqual(
            enrich_schedule(rows, "spring_2027", topics).iloc[0]["Description"],
            "Advanced Python",
        )
        grades = normalize_grades({"Spring 2026": self.grade_sheet()})
        pd.testing.assert_frame_equal(enrich_grades(grades, topics), grades)
        grades["Term"] = "Spring 2027"
        self.assertEqual(
            enrich_grades(grades, topics).iloc[0]["Course Name"], "Advanced Python"
        )

    def test_missing_average_column_uses_grade_counts(self):
        grades = normalize_grades(
            {"Spring 2026": self.grade_sheet().drop(columns="avg gpa")}
        )
        self.assertEqual(build_instructor_summaries(grades).iloc[0]["avg gpa"], 3.25)

    def test_historical_gpa_fallback(self):
        grades = normalize_grades(
            {"Spring 2026": self.grade_sheet().iloc[:1].drop(columns=["a", "b"])}
        )
        self.assertEqual(build_instructor_summaries(grades).iloc[0]["avg gpa"], 4.0)


if __name__ == "__main__":
    unittest.main()
