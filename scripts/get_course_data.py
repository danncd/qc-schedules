import io
import pandas as pd
from playwright.sync_api import sync_playwright

SEMESTERS = {
    "02N": "Spring",
    "06N": "Summer 1",
    "06Y": "Summer 2",
    "09N": "Fall",
    "02Y": "Winter"
}

def get_course_data():
    
    all_semesters_df = {}

    with sync_playwright() as p:

        browser = p.chromium.launch(headless= True)
        page = browser.new_page()

        print("Opening QC Course Search...")
        page.goto("https://apps.qc.cuny.edu/courses/")

        year = page.locator(
            "#MainContent_tcMainSearch_tbCourseSchd_ddlTermYear"
        ).input_value()

        print("Clicking schedule window...")
        page.get_by_text("Schedule").first.click()

        for value, name in SEMESTERS.items():
            print(f"Processing {name} {year}...")

            page.select_option(
                "#MainContent_tcMainSearch_tbCourseSchd_ddlSemester",
                value
            )

            page.locator(
                "#MainContent_tcMainSearch_tbCourseSchd_btnBringSchedule"
            ).click()

            page.wait_for_selector("#gvCourseSchd", timeout=60000)

            html = page.content()

            df = pd.read_html(
                io.StringIO(html),
                attrs={"id": "gvCourseSchd"}
            )[0]

            df = df.dropna(how="all", axis=1)
            all_semesters_df[f"{name} {year}"] = df

        browser.close()
    return all_semesters_df

if __name__ == "__main__":
    get_course_data()