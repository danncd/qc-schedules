import { test, expect } from "@playwright/test";

test("linked pagination survives hydration and filtering resets the page", async ({
    page,
}) => {
    await page.goto("/schedule?sem=fall_2026&page=3");
    await expect(
        page.getByRole("navigation", { name: "Pagination" }),
    ).toContainText("Page 3 of");
    await page.waitForTimeout(500);
    await expect(
        page.getByRole("navigation", { name: "Pagination" }),
    ).toContainText("Page 3 of");
    await page.getByRole("searchbox").fill("CSCI 111");
    await expect(
        page.getByRole("navigation", { name: "Pagination" }),
    ).toContainText("Page 1 of");
    await expect(page.locator(".course-card").first()).toContainText(
        "CSCI 111",
    );
    await page.getByRole("searchbox").fill("No matching class abcxyz");
    await expect(
        page.getByText("No matching sections.", { exact: false }),
    ).toBeVisible();
    expect(
        await page
            .locator(".site-footer")
            .evaluate((el) => el.getBoundingClientRect().top),
    ).toBeGreaterThanOrEqual(1000);
});

test("semester menu works with the keyboard and browser back", async ({
    page,
}) => {
    await page.goto("/schedule?sem=fall_2026");
    await page.getByRole("button", { name: "Semester", exact: true }).click();
    await page
        .getByRole("option", { name: "Spring 2026", exact: true })
        .click();
    await expect(page.locator(".results-count")).toContainText("Spring 2026");
    await page.goBack();
    await expect(page.locator(".results-count")).toContainText("Fall 2026");
    await page.getByRole("button", { name: "Semester", exact: true }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("stats disclose accessibly and link to a real instructor history", async ({
    page,
}) => {
    await page.goto("/schedule?sem=fall_2026");
    const stats = page.locator(".instructor-block .disclosure-trigger").first();
    await stats.click();
    await expect(stats).toHaveAttribute("aria-expanded", "true");
    const content = page.locator(
        `#${await stats.getAttribute("aria-controls")}`,
    );
    await expect(content).not.toHaveAttribute("inert", "");
    await content.getByRole("link", { name: /Visit instructor/ }).click();
    await expect(
        page.getByRole("heading", { name: /Historical Data for/ }),
    ).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Course history", exact: true }),
    ).toBeVisible();
    await expect(
        page
            .locator(".semester-section .card")
            .first()
            .locator(".stats-surface .grade-statistics > div")
            .first(),
    ).toContainText(/^Students\d+|Students—$/);
    await expect(
        page.locator(".semester-section .card").first().locator(".course-id"),
    ).not.toContainText("Students");
    await page
        .getByRole("button", { name: "Collapse All", exact: true })
        .click();
    for (const button of await page
        .locator(".semester-section .disclosure-trigger")
        .all())
        await expect(button).toHaveAttribute("aria-expanded", "false");
});

test("mobile layout, sticky header, and saved dark theme", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/schedule?sem=fall_2026");
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
    await page.evaluate(() => scrollTo(0, 700));
    expect(
        await page
            .locator(".site-header")
            .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    ).toBe(0);
    await page
        .getByRole("button", { name: "Toggle light or dark theme" })
        .click();
    const dark = await page.locator("html").getAttribute("class");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("class", dark || "");
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
});

test("directory search and unknown instructor states", async ({ page }) => {
    await page.goto("/instructor");
    await page.getByRole("searchbox").fill("CSCI");
    await expect(page.locator(".instructor-card").first()).toContainText(
        "CSCI",
    );
    await page.goto("/instructor/not-a-real-instructor-0000");
    await expect(
        page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
});

test("room and reversed instructor searches work without a page reload", async ({
    page,
}) => {
    await page.goto("/schedule?sem=fall_2026");
    await page.getByRole("searchbox").fill("SB A135B");
    await expect(page.locator(".course-card").first()).toContainText(
        "SB A135B",
    );
    for (const card of await page.locator(".course-card").all()) {
        await expect(card).toContainText("SB A135B");
    }
    await page.getByRole("searchbox").fill("Tim Mitchell");
    await expect(page.locator(".course-card").first()).toContainText(
        "Mitchell, Timothy",
    );
});

test("background refresh preserves filters and expanded statistics", async ({
    page,
}) => {
    await page.clock.install();
    await page.goto("/schedule?sem=fall_2026&q=PSYCH");
    await expect(page.getByRole("searchbox")).toHaveValue("PSYCH");
    const stats = page.locator(".instructor-block .disclosure-trigger").first();
    await stats.click();
    await expect(stats).toHaveAttribute("aria-expanded", "true");
    const refresh = page.waitForResponse((response) =>
        response.url().includes("_rsc="),
    );
    await page.clock.fastForward(301000);
    await refresh;
    await expect(page.getByRole("searchbox")).toHaveValue("PSYCH");
    await expect(stats).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".course-card").first()).toBeVisible();
});

test("overlapping schedule times are consolidated while rooms remain visible", async ({
    page,
}) => {
    await page.goto("/schedule?sem=winter_2027&q=20717");
    const card = page.locator(".course-card").first();
    await expect(card).toContainText("CSCI 381");
    await expect(card.locator(".meeting-times > div")).toHaveCount(1);
    await expect(card.locator(".meeting-times")).toHaveText(
        "M, T, W, TH, F10:00 AM - 12:50 PM",
    );
    const rooms = card.locator(".facts > div").filter({ hasText: "Room:" });
    await expect(rooms).toHaveCount(2);
    await expect(rooms.filter({ hasText: "SB C201" })).toContainText("M, F");
    await expect(rooms.filter({ hasText: "OL 01" })).toContainText(
        "M, T, W, TH, F",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
});
