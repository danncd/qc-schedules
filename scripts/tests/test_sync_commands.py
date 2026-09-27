import unittest
from unittest.mock import patch

import pandas as pd

from scripts import sync_grades, sync_schedule
from scripts.tests import test_transforms


class SyncCommandTests(unittest.TestCase):
    def test_schedule_preview_never_connects(self):
        rows = pd.DataFrame(
            [
                {
                    "Code": "123",
                    "Sec": "01",
                    "Course (hr, crd)": "CSCI 381",
                    "Description": "Topics",
                }
            ]
        )
        with patch.object(
            sync_schedule, "fetch_schedules", return_value={"fall_2026": rows}
        ), patch.object(
            sync_schedule, "fetch_topic_courses", return_value={}
        ), patch.object(
            sync_schedule, "create_database_engine"
        ) as connect:
            self.assertEqual(sync_schedule.run(), {"fall_2026": 1})
            connect.assert_not_called()

    def test_grade_preview_never_connects(self):
        with patch.object(
            sync_grades,
            "fetch_grade_sheets",
            return_value={
                "Spring 2026": test_transforms.TransformTests().grade_sheet()
            },
        ), patch.object(
            sync_grades, "fetch_topic_courses", return_value={}
        ), patch.object(
            sync_grades, "create_database_engine"
        ) as connect:
            self.assertEqual(
                sync_grades.run(),
                {"instructor_grades": 2, "instructor_course_summary": 1},
            )
            connect.assert_not_called()

    def test_grades_commit_saves_both_tables_together(self):
        with patch.object(
            sync_grades,
            "fetch_grade_sheets",
            return_value={
                "Spring 2026": test_transforms.TransformTests().grade_sheet()
            },
        ), patch.object(
            sync_grades, "fetch_topic_courses", return_value={}
        ), patch.object(
            sync_grades, "create_database_engine"
        ) as connect, patch.object(
            sync_grades, "sync_tables"
        ) as save:
            sync_grades.run(commit=True)
            save.assert_called_once()
            self.assertEqual(
                set(save.call_args.args[1]),
                {"instructor_grades", "instructor_course_summary"},
            )
            connect.return_value.dispose.assert_called_once()

    def test_commit_failure_disposes_connection(self):
        with patch.object(
            sync_grades,
            "fetch_grade_sheets",
            return_value={
                "Spring 2026": test_transforms.TransformTests().grade_sheet()
            },
        ), patch.object(
            sync_grades, "fetch_topic_courses", return_value={}
        ), patch.object(
            sync_grades, "create_database_engine"
        ) as connect, patch.object(
            sync_grades, "sync_tables", side_effect=RuntimeError("failed")
        ):
            with self.assertRaises(RuntimeError):
                sync_grades.run(commit=True)
            connect.return_value.dispose.assert_called_once()
