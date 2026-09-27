import { test, expect } from "@playwright/test";

test.beforeEach(() => {
    test.skip(
        !process.env.PLAYWRIGHT_BASE_URL,
        "Shared page caching requires a production server.",
    );
});

test("separate visitors share the cached schedule while keeping their own filters", async ({
    browser,
    baseURL,
}) => {
    const first = await browser.newContext({ baseURL });
    const second = await browser.newContext({ baseURL });
    try {
        const firstPage = await first.newPage();
        const firstResponse = await firstPage.goto(
            "/schedule?sem=fall_2026&q=CSCI",
        );
        await expect(firstPage.locator(".results-count")).toContainText(
            "Fall 2026",
        );
        await expect(firstPage.locator(".course-card").first()).toContainText(
            "CSCI",
        );
        const secondPage = await second.newPage();
        const secondResponse = await secondPage.goto(
            "/schedule?sem=spring_2026&q=PSYCH",
        );
        await expect(secondPage.locator(".results-count")).toContainText(
            "Spring 2026",
        );
        await expect(secondPage.locator(".course-card").first()).toContainText(
            "PSYCH",
        );
        expect(firstResponse!.headers()["x-nextjs-cache"]).toBe("HIT");
        expect(secondResponse!.headers()["x-nextjs-cache"]).toBe("HIT");
        expect(secondResponse!.headers().etag).toBe(
            firstResponse!.headers().etag,
        );
        expect(secondResponse!.headers()["cache-control"]).toContain(
            "s-maxage=14400",
        );
    } finally {
        await first.close();
        await second.close();
    }
});

test("instructor directories and generated histories are shared between visitors", async ({
    browser,
    baseURL,
}) => {
    const first = await browser.newContext({ baseURL });
    const second = await browser.newContext({ baseURL });
    try {
        const firstPage = await first.newPage();
        const directory = await firstPage.goto("/instructor");
        await expect(
            firstPage.locator(".instructor-card").first(),
        ).toBeVisible();
        const href = await firstPage
            .locator(".instructor-card")
            .first()
            .getAttribute("href");
        const history = await firstPage.goto(href!);
        await expect(
            firstPage.getByRole("heading", { name: /Historical Data for/ }),
        ).toBeVisible();
        const secondPage = await second.newPage();
        const nextDirectory = await secondPage.goto("/instructor");
        expect(directory!.headers()["x-nextjs-cache"]).toBe("HIT");
        expect(nextDirectory!.headers()["x-nextjs-cache"]).toBe("HIT");
        const nextHistory = await secondPage.goto(href!);
        expect(nextHistory!.headers()["x-nextjs-cache"]).toBe("HIT");
        expect(nextHistory!.headers().etag).toBe(history!.headers().etag);
        expect(nextHistory!.headers()["cache-control"]).toContain(
            "s-maxage=14400",
        );
    } finally {
        await first.close();
        await second.close();
    }
});
