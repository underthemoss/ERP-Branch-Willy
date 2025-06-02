import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { login } from "../shared";

test("full business contact creation and verification flow", async ({
  page,
}) => {
  await login({ page });

  // Click through to contacts via nav
  await page.getByTestId("nav-contacts").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();

  // Click create contact, choose business
  await page.getByRole("button", { name: "+ Add Contact" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Add Business" }).click();

  // Fill and submit the business contact form
  await expect(page).toHaveURL(/\/contacts\/create-business/);
  const businessName = faker.company.name();
  const taxId = faker.string.alphanumeric(10).toUpperCase();
  await page.getByLabel("Business Name").fill(businessName);
  await page.getByLabel("Tax ID").fill(taxId);
  await page.getByRole("button", { name: "Add Business" }).click();

  // Should redirect to the new contact's detail page
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);

  // Verify details page shows the correct name and tax ID
  await expect(page.getByText(businessName)).toBeVisible();
  await expect(page.getByText(taxId)).toBeVisible();

  // Click nav to return to contacts list page
  await page.getByTestId("nav-contacts").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();

  // Optionally, search for the contact again to confirm it appears in the list
  await page.getByPlaceholder("Search contacts").fill(businessName);
  await expect(page.getByText(businessName)).toBeVisible({ timeout: 15000 });

  // Click the row for the contact just created
  const contactRow = page
    .locator(".MuiDataGrid-row", { hasText: businessName })
    .first();
  await contactRow.click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);

  // Verify details page shows the correct name and tax ID again
  await expect(page.getByText(businessName)).toBeVisible();
  await expect(page.getByText(taxId)).toBeVisible();

  // Click edit, change the name, click save, verify the name change
  await page.getByTestId("edit-contact").click();
  const newBusinessName = faker.company.name();
  await page.getByLabel("Business Name").fill(newBusinessName);
  await page.getByTestId("save-contact").click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
  await expect(page.getByText(newBusinessName)).toBeVisible();

  // Navigate to contacts page, search for the new business name, verify row, click, verify details
  await page.getByTestId("nav-contacts").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await page.getByPlaceholder("Search contacts").fill(newBusinessName);
  await expect(page.getByText(newBusinessName)).toBeVisible({ timeout: 15000 });
  const editedContactRow = page
    .locator(".MuiDataGrid-row", { hasText: newBusinessName })
    .first();
  await editedContactRow.click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
  await expect(page.getByText(newBusinessName)).toBeVisible();
  await expect(page.getByText(taxId)).toBeVisible();

  // Click delete, confirm, verify contact is gone
  await page.getByTestId("delete-contact").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /^delete$/i }).click();
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await page.getByPlaceholder("Search contacts").fill(newBusinessName);
  // Wait for a short time to ensure the list updates
  await page.waitForTimeout(1000);
  // Assert that the row is not present
  const deletedRow = page.locator(".MuiDataGrid-row", {
    hasText: newBusinessName,
  });
  await expect(deletedRow).toHaveCount(0);
});
