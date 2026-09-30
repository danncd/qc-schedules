import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from scripts.sources import schedules


class ScheduleSourceTests(unittest.TestCase):
    def setUp(self):
        self.playwright = MagicMock()
        self.browser = self.playwright.chromium.launch.return_value
        self.page = self.browser.new_page.return_value
        self.page.locator.return_value.input_value.return_value = "2026"
        self.page.wait_for_load_state.side_effect = schedules.PlaywrightTimeoutError(
            "Background requests keep the page from becoming idle."
        )
        self.page.locator.return_value.locator.return_value.evaluate_all.return_value = [
            "2026", "2025"
        ]
        self.empty_term = None
        self.bad_term = None
        self.status = 200
        self.candidate_responses = []
        self.page.expect_response.side_effect = self.submit

    def response(self, html, *, navigation=True, method="POST", frame=None):
        response = MagicMock()
        response.url = schedules.COURSE_SEARCH_URL
        response.request.is_navigation_request.return_value = navigation
        response.request.method = method
        response.frame = self.page.main_frame if frame is None else frame
        response.ok = self.status == 200
        response.status = self.status
        response.text.return_value = html
        self.candidate_responses.append(response)
        return response

    def submit(self, predicate, **kwargs):
        semester = self.page.select_option.call_args.args[1]
        html = (
            '<table id="gvCourseSchd"><tr><th>Code</th></tr>'
            f"<tr><td>{semester}</td></tr></table>"
        )
        if semester == self.bad_term:
            html = "<p>No schedule available.</p>"
        if semester == self.empty_term:
            html = "<p>No schedule has been found. Please try different search condition.</p>"
        responses = [
            self.response("asset", navigation=False, method="GET"),
            self.response("iframe", frame=object()),
            self.response(html),
        ]
        submitted = MagicMock()
        submitted.__enter__.return_value = SimpleNamespace(
            value=next(response for response in responses if predicate(response))
        )
        return submitted

    def fetch(self, year=None):
        with patch.object(schedules, "sync_playwright") as start:
            start.return_value.__enter__.return_value = self.playwright
            return schedules.fetch_schedules(year)

    def test_all_terms_load_despite_continuing_background_traffic(self):
        rows = self.fetch()
        self.assertEqual(
            {name: table.iloc[0].Code for name, table in rows.items()},
            {f"{season}_2026": value for value, season in schedules.SEMESTERS.items()},
        )
        # Ignore resources and iframe responses, even from the same URL.
        for response in self.candidate_responses:
            if not response.request.is_navigation_request() or (
                response.frame != self.page.main_frame
            ):
                response.text.assert_not_called()
        self.browser.close.assert_called_once()

    def test_explicit_year_does_not_wait_for_network_idle(self):
        self.page.locator.return_value.input_value.return_value = "2027"
        rows = self.fetch(year=2027)
        self.assertEqual(set(rows), {f"{s}_2027" for s in schedules.SEMESTERS.values()})
        self.page.locator.return_value.select_option.assert_called_once_with("2027")

    def test_default_includes_upcoming_years_but_not_historical_years(self):
        self.page.locator.return_value.locator.return_value.evaluate_all.return_value = [
            "2027", "2026", "2025", ""
        ]
        rows = self.fetch()
        self.assertEqual(set(rows), {
            f"{season}_{year}"
            for year in (2026, 2027) for season in schedules.SEMESTERS.values()
        })
        self.assertEqual(
            [call.args[0] for call in self.page.locator.return_value.select_option.call_args_list],
            ["2026", "2027"],
        )

    def test_unpublished_terms_are_omitted_without_reusing_previous_rows(self):
        self.empty_term = "06N"
        rows = self.fetch(year=2027)
        self.assertNotIn("summer_1_2027", rows)
        self.assertEqual(len(rows), 4)
        self.assertIn("winter_2027", rows)
        self.browser.close.assert_called_once()

    def test_missing_table_fails_instead_of_reusing_previous_term(self):
        self.bad_term = "02Y"
        self.page.content.return_value = (
            '<table id="gvCourseSchd"><tr><th>Code</th></tr>'
            "<tr><td>old-fall-row</td></tr></table>"
        )
        with self.assertRaisesRegex(RuntimeError, "winter_2026"):
            self.fetch()
        self.browser.close.assert_called_once()

    def test_http_failure_identifies_the_term_and_closes_browser(self):
        self.status = 503
        with self.assertRaisesRegex(RuntimeError, "spring_2026") as error:
            self.fetch()
        self.assertIn("HTTP 503", str(error.exception.__cause__))
        self.browser.close.assert_called_once()

    def test_response_timeout_identifies_the_term_and_closes_browser(self):
        self.page.expect_response.side_effect = schedules.PlaywrightTimeoutError(
            "No schedule response."
        )
        with self.assertRaisesRegex(RuntimeError, "spring_2026"):
            self.fetch()
        self.browser.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
