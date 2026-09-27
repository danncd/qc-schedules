import { test, expect, type Page } from "@playwright/test";

test("the home address opens courses", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/schedule$/);
    await expect(
        page.getByRole("heading", { name: "Course Schedule Lookup" }),
    ).toBeVisible();
});

async function selectTerm(page: Page, label: string) {
    await page.getByRole("button", { name: "Semester", exact: true }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await expect(page.locator(".results-count")).toContainText(label);
}

test("visited courses, semesters, and instructor pages reuse the page cache", async ({
    page,
}) => {
    test.skip(
        !process.env.PLAYWRIGHT_BASE_URL,
        "Full prefetching requires a production server.",
    );
    await page.clock.install();
    await page.goto("/schedule?sem=fall_2026");
    await expect(page.locator(".course-card").first()).toBeVisible();
    await selectTerm(page, "Spring 2026");
    await selectTerm(page, "Fall 2026");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await nav.getByRole("link", { name: "Instructors" }).click();
    await expect(page.locator(".instructor-card").first()).toBeVisible();
    const first = page.locator(".instructor-card").first();
    const href = await first.getAttribute("href");
    await first.click();
    await expect(
        page.getByRole("heading", { name: /Historical Data for/ }),
    ).toBeVisible();
    await page.getByRole("link", { name: "← All instructors" }).click();
    await expect(first).toBeVisible();
    const requests: string[] = [];
    page.on("request", (request) => {
        if (
            request.url().includes("_rsc=") &&
            !request.headers()["next-router-prefetch"]
        )
            requests.push(request.url());
    });
    await page.locator(`a.instructor-card[href="${href}"]`).click();
    await expect(
        page.getByRole("heading", { name: /Historical Data for/ }),
    ).toBeVisible();
    await page.getByRole("link", { name: "← All instructors" }).click();
    await expect(first).toBeVisible();
    await nav.getByRole("link", { name: "Courses" }).click();
    await expect(page.locator(".course-card").first()).toBeVisible();
    await selectTerm(page, "Spring 2026");
    await selectTerm(page, "Fall 2026");
    expect(requests).toEqual([]);
    const refreshed = page.waitForResponse((response) =>
        response.url().includes("_rsc="),
    );
    await page.clock.fastForward(301000);
    await refreshed;
    await expect(page.locator(".results-count")).toContainText("Fall 2026");
});
