import unittest

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from scripts.database.sync import sync_tables


class DatabaseSyncTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")

    def tearDown(self):
        self.engine.dispose()

    def test_preserves_created_and_distinct_meetings(self):
        original = pd.DataFrame([{"Code": "123", "Day": "Monday"}])
        sync_tables(self.engine, {"fall_2026": original})
        before = pd.read_sql_table("fall_2026", self.engine)
        updated = pd.DataFrame(
            [
                {"Code": "123", "Day": "Monday"},
                {"Code": "123", "Day": "Wednesday"},
                {"Code": "456", "Day": "Tuesday"},
            ]
        )
        counts = sync_tables(self.engine, {"fall_2026": updated})
        after = pd.read_sql_table("fall_2026", self.engine)
        self.assertEqual(counts, {"fall_2026": 3})
        self.assertTrue(
            (after.loc[after.Code == "123", "created"] == before.iloc[0].created).all()
        )
        self.assertNotIn("created", updated.columns)

    def test_empty_input_does_not_delete_records(self):
        sync_tables(self.engine, {"fall_2026": pd.DataFrame([{"Code": "123"}])})
        with self.assertRaises(ValueError):
            sync_tables(self.engine, {"fall_2026": pd.DataFrame(columns=["Code"])})
        self.assertEqual(len(pd.read_sql_table("fall_2026", self.engine)), 1)

    def test_failure_rolls_back_all_replacements(self):
        sync_tables(
            self.engine,
            {
                "fall_2026": pd.DataFrame([{"Code": "old-fall"}]),
                "spring_2026": pd.DataFrame([{"Code": "old-spring"}]),
            },
        )
        with self.assertRaises(SQLAlchemyError):
            sync_tables(
                self.engine,
                {
                    "fall_2026": pd.DataFrame([{"Code": "new-fall"}]),
                    "spring_2026": pd.DataFrame(
                        [{"Code": "new-spring", "unexpected": 1}]
                    ),
                },
            )
        self.assertEqual(
            pd.read_sql_table("fall_2026", self.engine).iloc[0].Code, "old-fall"
        )
        self.assertEqual(
            pd.read_sql_table("spring_2026", self.engine).iloc[0].Code, "old-spring"
        )

    def test_missing_created_does_not_reset_history(self):
        with self.engine.begin() as connection:
            connection.execute(text('CREATE TABLE fall_2026 ("Code" TEXT)'))
            connection.execute(text("INSERT INTO fall_2026 VALUES ('123')"))
        with self.assertRaisesRegex(ValueError, "Missing required database columns"):
            sync_tables(self.engine, {"fall_2026": pd.DataFrame([{"Code": "456"}])})
        self.assertEqual(
            pd.read_sql_table("fall_2026", self.engine).iloc[0].Code, "123"
        )

    def test_rejects_unknown_table_names(self):
        with self.assertRaisesRegex(ValueError, "Unsupported table"):
            sync_tables(
                self.engine, {"unexpected_table": pd.DataFrame([{"Code": "123"}])}
            )


if __name__ == "__main__":
    unittest.main()
