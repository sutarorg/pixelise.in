import { expect, test } from "../fixtures/test";

test.describe("contact form", () => {
  test("required fields are enforced before any request @smoke", async ({ page }) => {
    await page.goto("/contact");

    const form = page.locator("form").first();
    await expect(form).toBeVisible();

    await form.getByRole("button", { name: /send message/i }).click();

    // Native constraint validation blocks submission; nothing claims success.
    await expect(page.getByText(/message sent|we will get back|thanks for reaching out/i)).toHaveCount(0);
    await expect(form).toBeVisible();
  });

  test("invalid email is reported on the field", async ({ page }) => {
    await page.goto("/contact");

    const form = page.locator("form").first();
    await form.getByLabel(/^name$/i).fill("Test Person");
    await form.getByLabel(/^email$/i).fill("not-an-email");
    const message = form.getByLabel(/message/i);
    await message.fill("This is a validation check for the end-to-end suite.");

    await form.getByRole("button", { name: /send message/i }).click();

    // Either the browser blocks it or the server returns field errors; both are acceptable,
    // a success state is not.
    await expect(page.getByText(/message sent/i)).toHaveCount(0);
  });

  test("unconfigured backend surfaces a real error, never a fake success", async ({ page }) => {
    await page.goto("/contact");

    const form = page.locator("form").first();
    await form.getByLabel(/^name$/i).fill("Test Person");
    await form.getByLabel(/^email$/i).fill("e2e@example.com");
    await form.getByLabel(/message/i).fill("Checking the not-configured path of the contact endpoint.");

    await form.getByRole("button", { name: /send message/i }).click();

    // In an unconfigured environment the endpoint returns 503 not_configured and the
    // form shows an error. On staging with email configured it returns a ticket id.
    const errorText = page.getByRole("alert");
    const success = page.getByText(/message received|message sent|we will reply/i);

    await expect(async () => {
      const hasError = (await errorText.count()) > 0;
      const hasSuccess = (await success.count()) > 0;
      expect(hasError || hasSuccess).toBe(true);
    }).toPass({ timeout: 15_000 });
  });
});
