import os
import unittest
import uuid

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from scripts.database.sync import sync_tables
from scripts.tests import test_database_sync


@unittest.skipUnless(
    os.environ.get("QCS_TEST_DATABASE_URL"), "Local PostgreSQL test URL not configured"
)
class PostgresSyncTests(test_database_sync.DatabaseSyncTests):
    def setUp(self):
        url = make_url(os.environ["QCS_TEST_DATABASE_URL"])
        if url.host not in {"localhost", "127.0.0.1"} or url.database != "qcs_test":
            raise ValueError("Integration tests require a local qcs_test database.")
        self.schema = "qcs_test_" + uuid.uuid4().hex
        self.admin = create_engine(url)
        with self.admin.begin() as connection:
            connection.execute(text(f"CREATE SCHEMA {self.schema}"))
            for role in ("anon", "authenticated"):
                exists = connection.execute(
                    text("SELECT 1 FROM pg_roles WHERE rolname=:role"), {"role": role}
                ).scalar()
                if not exists:
                    connection.execute(text(f"CREATE ROLE {role}"))
            connection.execute(
                text(f"GRANT USAGE ON SCHEMA {self.schema} TO anon, authenticated")
            )
        self.engine = create_engine(
            url,
            connect_args={"options": f"-c search_path={self.schema} -c timezone=UTC"},
        )

    def tearDown(self):
        self.engine.dispose()
        with self.admin.begin() as connection:
            connection.execute(text(f"DROP SCHEMA {self.schema} CASCADE"))
        self.admin.dispose()

    def test_new_tables_allow_public_read_only(self):
        sync_tables(self.engine, {"fall_2026": pd.DataFrame([{"Code": "123"}])})
        with self.engine.connect() as connection:
            enabled = connection.execute(
                text(
                    "SELECT relrowsecurity FROM pg_class WHERE oid='fall_2026'::regclass"
                )
            ).scalar()
            self.assertTrue(enabled)
            self.assertTrue(
                connection.execute(
                    text("SELECT has_table_privilege('anon', 'fall_2026', 'SELECT')")
                ).scalar()
            )
            self.assertFalse(
                connection.execute(
                    text("SELECT has_table_privilege('anon', 'fall_2026', 'INSERT')")
                ).scalar()
            )
            connection.execute(text("SET LOCAL ROLE anon"))
            self.assertEqual(
                connection.execute(text('SELECT "Code" FROM fall_2026')).scalar(), "123"
            )
