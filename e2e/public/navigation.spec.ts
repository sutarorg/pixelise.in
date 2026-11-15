import { expect, test } from "../fixtures/test";

test.describe("navigation", () => {
  test("skip link moves focus to main @smoke", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to (main )?content/i });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page.locator("main#main")).toBeVisible();
  });

  test("primary navigation reaches every marketing page @smoke", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of ["Features", "Examples", "Pricing", "How it works"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }

    await nav.getByRole("link", { name: "Pricing", exact: true }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("resources menu exposes the journal @smoke", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /resources/i });
    await trigger.click();
    const journal = page.getByRole("link", { name: /journal/i }).first();
    await expect(journal).toBeVisible();
    await journal.click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Better product photography starts with better ideas.",
    );
  });

  test("mobile menu opens, closes on Escape and lists the journal @mobile", async ({ page }) => {
    await page.goto("/");
    const open = page.getByRole("button", { name: "Open menu" });
    await expect(open).toBeVisible();
    await open.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: /journal/i })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // Focus returns to the trigger — Radix handles this, we verify it.
    await expect(open).toBeFocused();
  });

  test("footer links resolve", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");

    await expect(footer.getByRole("link", { name: "Journal" }).first()).toBeVisible();
    await footer.getByRole("link", { name: "Privacy policy" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
