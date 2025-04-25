import { test, expect } from "@playwright/test";

test("user must be authenticated", async ({ page }) => {
  await page.goto("/es-erp/");
  await expect(
    page.getByText("Could not authenticate", { exact: false }),
  ).toBeVisible();
});
