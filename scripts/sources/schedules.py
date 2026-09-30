import io

import pandas as pd
from bs4 import BeautifulSoup
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
            page.goto(COURSE_SEARCH_URL, wait_until="domcontentloaded")
            page.get_by_text("Schedule").first.click()

            year_select = page.locator(f"{SCHEDULE_FORM}ddlTermYear")
            selected_year = int(year_select.input_value())
            available_years = year_select.locator("option").evaluate_all(
                "options => options.map(option => option.value)"
            )
            years = (
                [year]
                if year is not None
                else sorted(
                    {
                        int(value)
                        for value in available_years
                        if value.isdigit() and int(value) >= selected_year
                    }
                )
            )
            if not years:
                raise RuntimeError("No current or upcoming schedule years were found.")

            for selected_year in years:
                year_select.select_option(str(selected_year))
                for value, semester in SEMESTERS.items():
                    semester_key = f"{semester}_{selected_year}"
                    print(f"Fetching {semester_key}...")
                    page.select_option(f"{SCHEDULE_FORM}ddlSemester", value)
                    try:
                        # The dropdowns are local form values. Only Display Results
                        # submits a new document; unrelated traffic need not be idle.
                        with page.expect_response(
                            lambda response: (
                                response.request.is_navigation_request()
                                and response.frame == page.main_frame
                                and response.request.method == "POST"
                            ),
                            timeout=30000,
                        ) as submitted:
                            page.locator(f"{SCHEDULE_FORM}btnBringSchedule").click()
                        response = submitted.value
                        if not response.ok:
                            raise ValueError(
                                f"Schedule request returned HTTP {response.status}."
                            )
                        # Parse this submission, never a previous term's table.
                        html = response.text()
                        soup = BeautifulSoup(html, "html.parser")
                        if soup.find("table", id="gvCourseSchd") is None and (
                            "No schedule has been found. Please try different search condition."
                            in soup.get_text(" ", strip=True)
                        ):
                            print(f"Skipping {semester_key}: no schedule published.")
                            continue
                        tables = pd.read_html(
                            io.StringIO(html),
                            attrs={"id": "gvCourseSchd"},
                            flavor="lxml",
                        )
                    except (PlaywrightTimeoutError, ValueError) as error:
                        raise RuntimeError(
                            f"Could not read the schedule for {semester_key}."
                        ) from error

                    schedules[semester_key] = tables[0]
        finally:
            browser.close()

    return schedules
