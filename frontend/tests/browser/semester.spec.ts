import { expect, test } from "@playwright/test";

test("selects a semester and supports dismissal and back navigation", async ({
    page,
    isMobile,
}) => {
    await page.goto("/schedule?sem=fall_2026");
    const trigger = page.getByRole("button", {
        name: "Semester",
        exact: true,
    });
    const activate = async (locator: ReturnType<typeof page.getByRole>) => {
        if (isMobile) await locator.tap();
        else await locator.click();
    };
    await activate(trigger);
    await expect(
        page.getByRole("option", {
            name: "Fall 2026",
            exact: true,
        }),
    ).toBeFocused();
    await activate(
        page.getByRole("option", {
            name: "Spring 2026",
            exact: true,
        }),
    );
    await expect(trigger).toContainText("Spring 2026");
    await expect(page).toHaveURL(/sem=spring_2026/);
    await expect(page.locator(".results-count")).toContainText("Spring 2026");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await page.goBack();
    await expect(trigger).toContainText("Fall 2026");
    await activate(trigger);
    const dismiss = page.locator(".select-dismiss");
    const position = { x: 10, y: 600 };
    if (isMobile) await dismiss.tap({ position });
    else await dismiss.click({ position });
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("listbox")).toHaveCount(0);
});
