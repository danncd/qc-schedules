import io

import pandas as pd
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

COURSE_SEARCH_URL = "https://apps.qc.cuny.edu/courses/"
SCHEDULE_FORM = "#MainContent_tcMainSearch_tbCourseSchd_"
SEMESTERS = {
    "02N": "spring",
    "06N": "summer_1",
    "06Y": "summer_2",
    "09N": "fall",
    "02Y": "winter",
}


def fetch_schedules(year: int | None = None) -> dict[str, pd.DataFrame]:
    schedules = {}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.goto(COURSE_SEARCH_URL)
            page.get_by_text("Schedule").first.click()

            year_select = page.locator(f"{SCHEDULE_FORM}ddlTermYear")
            if year is not None:
                year_select.select_option(str(year))
                page.wait_for_load_state("networkidle")
            selected_year = year_select.input_value()

            for value, semester in SEMESTERS.items():
                semester_key = f"{semester}_{selected_year}"
                print(f"Fetching {semester_key}...")
                page.select_option(f"{SCHEDULE_FORM}ddlSemester", value)
                page.wait_for_load_state("networkidle")

                with page.expect_response(
                    lambda response: "courses" in response.url.lower(),
                    timeout=30000,
                ):
                    page.locator(f"{SCHEDULE_FORM}btnBringSchedule").click()

                page.wait_for_load_state("networkidle")
                try:
                    page.wait_for_selector("#gvCourseSchd", timeout=20000)
                    tables = pd.read_html(
                        io.StringIO(page.content()),
                        attrs={"id": "gvCourseSchd"},
                    )
                except (PlaywrightTimeoutError, ValueError) as error:
                    raise RuntimeError(
                        f"Could not read the schedule for {semester_key}."
                    ) from error

                schedules[semester_key] = tables[0]
        finally:
            browser.close()

    return schedules
