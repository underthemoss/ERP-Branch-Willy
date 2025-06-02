import { test, expect } from "@playwright/test";
import { login } from "./shared";

test("navigate to inventory page via menu and verify", async ({ page }) => {
  await login({ page });

  // Click the menu/navigation to go to Inventory (more robust selector)
  await page.getByText("Inventory", { exact: false }).click();

  // Assert that the inventory page is displayed
  await expect(
    page.getByRole("heading", { name: "Inventory Management" }),
  ).toBeVisible();
});
