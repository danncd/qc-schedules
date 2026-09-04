import io
import pandas as pd
from playwright.sync_api import sync_playwright

SEMESTERS = {
    "02N": "spring",
    "06N": "summer 1",
    "06Y": "summer 2",
    "09N": "fall",
    "02Y": "winter"
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

            try:
                # Wait for postback / network activity triggered by clicking the button
                with page.expect_response(lambda r: "courses" in r.url.lower(), timeout=30000):
                    page.locator("#MainContent_tcMainSearch_tbCourseSchd_btnBringSchedule").click()
            except Exception:
                # If expect_response times out, fall back to direct click and selector wait
                page.locator("#MainContent_tcMainSearch_tbCourseSchd_btnBringSchedule").click()

            page.wait_for_load_state("networkidle")

            try:
                page.wait_for_selector("#gvCourseSchd", timeout=20000)
                html = page.content()

                tables = pd.read_html(
                    io.StringIO(html),
                    attrs={"id": "gvCourseSchd"}
                )

                if tables and not tables[0].empty:
                    df = tables[0].dropna(how="all", axis=1)
                    # Clean any unnamed or whitespace columns
                    df = df.loc[:, ~df.columns.astype(str).str.contains(r"^Unnamed")]
                    semester_key = f"{name} {year}".replace(" ", "_")
                    all_semesters_df[semester_key] = df
                    print(f"Successfully scraped {len(df)} courses for {semester_key}.")
                else:
                    print(f"No courses found for {name} {year}.")
            except Exception as e:
                print(f"Skipping {name} {year}: {e}")

        browser.close()
    return all_semesters_df

if __name__ == "__main__":
    all_semesters_df = get_course_data()
    for semester, df in all_semesters_df.items():
        print(f"{len(df)} - {semester}")