import { test, expect } from "@playwright/test";

test("user must be authenticated", async ({ page }) => {
  await page.goto("/app");

  await expect(
    page.getByText("Continue with google", { exact: false }),
  ).toBeVisible({ timeout: 10_000 });
});
