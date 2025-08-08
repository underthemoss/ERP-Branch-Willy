import { test, expect } from "@playwright/test";
import { login } from "./shared";

test("navigate to assets page via menu and verify", async ({ page }) => {
  await login({ page });

  // Click the menu/navigation to go to Assets (more robust selector)
  await page.getByText("Assets", { exact: false }).click();

  // Assert that the assets page is displayed
  await expect(
    page.getByRole("heading", { name: "Asset Management" }),
  ).toBeVisible();
});
