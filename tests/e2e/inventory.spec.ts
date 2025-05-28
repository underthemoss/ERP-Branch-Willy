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

test("expand the first row and inspect visible information", async ({
  page,
}) => {
  await login({ page });

  // Navigate to inventory page via menu
  await page.getByText("Inventory", { exact: false }).click();

  // Wait for the table to load and expand the first row
  // The expand icon is usually a button in the first column
  const expandButton = page
    .locator(
      'button[aria-label*="Expand"], [data-testid*="expand"], .MuiDataGrid-detailPanelToggleCell button',
    )
    .first();
  await expandButton.click();

  // Assert that the detail panel is visible and contains key information
  await expect(
    page.locator('[data-test="inventory-detail-panel"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-test="inventory-asset-name"]'),
  ).toBeVisible();
  await expect(page.locator('[data-test="inventory-asset-id"]')).toBeVisible();
  await expect(
    page.locator('[data-test="inventory-schedule-btn"]'),
  ).toBeVisible();
});
