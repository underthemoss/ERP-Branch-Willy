import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { login } from "../shared";

test("business table create, verify, delete flow", async ({ page }) => {
  await login({ page });

  // Expand the Contacts nav item, then click the Businesses subitem
  await page.getByTestId("expand-nav-contacts").click();
  await page.waitForTimeout(500);
  const businessesNav = page.getByTestId("nav-contacts-businesses");
  await businessesNav.waitFor({ state: "visible" });
  await businessesNav.click();
  await expect(page.getByTestId("business-list")).toBeVisible();

  // Create a business
  await page.getByRole("button", { name: "+ Add Business" }).click();
  await expect(page).toHaveURL(/\/contacts\/create-business/);
  const businessName = faker.company.name();
  const businessTaxId = faker.string.alphanumeric(10).toUpperCase();
  await page.getByLabel("Business Name").fill(businessName);
  await page.getByLabel("Tax ID").fill(businessTaxId);
  await page.getByRole("button", { name: "Add Business" }).click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
  await expect(page.getByText(businessName)).toBeVisible();

  // Navigate back to the business table (no need to expand again)
  await businessesNav.click();
  await expect(page.getByTestId("business-list")).toBeVisible();

  // Search for the business, click the row, verify details
  await page.getByPlaceholder("Search businesses").fill(businessName);
  await expect(page.getByText(businessName)).toBeVisible({ timeout: 15000 });
  const businessRow = page
    .locator(".MuiDataGrid-row", { hasText: businessName })
    .first();
  await businessRow.click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
  await expect(page.getByText(businessName)).toBeVisible();
  await expect(page.getByText(businessTaxId)).toBeVisible();

  // Delete the business
  await page.getByTestId("delete-contact").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /^delete$/i }).click();

  // After deletion, go back to the business table (no need to expand again)
  await businessesNav.click();
  await expect(page.getByTestId("business-list")).toBeVisible();

  // Search for the business again, verify it is not present
  await page.getByPlaceholder("Search businesses").fill(businessName);
  await page.waitForTimeout(1000);
  const deletedRow = page.locator(".MuiDataGrid-row", {
    hasText: businessName,
  });
  await expect(deletedRow).toHaveCount(0);
});
