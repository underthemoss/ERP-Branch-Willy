import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { login } from "../shared";

test("full employee contact creation and verification flow", async ({
  page,
}) => {
  await login({ page });

  // First, create a business contact to assign the employee to
  await page.getByTestId("nav-contacts").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await page.getByRole("button", { name: "+ Add Contact" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Add Business" }).click();
  await expect(page).toHaveURL(/\/contacts\/create-business/);
  const businessName = faker.company.name();
  const businessTaxId = faker.string.alphanumeric(10).toUpperCase();
  await page.getByLabel("Business Name").fill(businessName);
  await page.getByLabel("Tax ID").fill(businessTaxId);
  await page.getByRole("button", { name: "Add Business" }).click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
  await expect(page.getByText(businessName)).toBeVisible();

  // Now create the employee and assign to the new business
  await page.getByTestId("nav-contacts").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await page.getByRole("button", { name: "+ Add Contact" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Add Employee" }).click();

  await expect(page).toHaveURL(/\/contacts\/create-employee/);
  const employeeName = faker.person.fullName();
  const email = faker.internet.email();
  const role = faker.person.jobTitle();
  // Select the business just created
  const businessSelect = page.getByLabel("Business");
  await businessSelect.click();
  await page.getByRole("option", { name: businessName }).click();

  await page.getByLabel("Name").fill(employeeName);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role").fill(role);
  await page.getByRole("button", { name: /add employee|create/i }).click();

  // Should redirect to the new contact's detail page
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);

  // Verify details page shows the correct name, email, and role
  await expect(page.getByText(employeeName)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText(role)).toBeVisible();

  // Click nav to return to contacts list page
  await page.getByTestId("nav-contacts").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();

  // Search for the contact again to confirm it appears in the list
  await page.getByPlaceholder("Search contacts").fill(employeeName);
  await expect(page.getByText(employeeName)).toBeVisible({ timeout: 15000 });

  // Click the row for the contact just created
  const contactRow = page
    .locator(".MuiDataGrid-row", { hasText: employeeName })
    .first();
  await contactRow.click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);

  // Verify details page shows the correct name, email, and role again
  await expect(page.getByText(employeeName)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText(role)).toBeVisible();

  // Click edit, change the name, click save, verify the name change
  await page.getByTestId("edit-contact").click();
  const newEmployeeName = faker.person.fullName();
  await page.getByLabel("Name").fill(newEmployeeName);
  await page.getByTestId("save-contact").click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
  await expect(page.getByText(newEmployeeName)).toBeVisible();

  // Navigate to contacts page, search for the new employee name, verify row, click, verify details
  await page.getByTestId("nav-contacts").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await page.getByPlaceholder("Search contacts").fill(newEmployeeName);
  await expect(page.getByText(newEmployeeName)).toBeVisible({ timeout: 15000 });
  const editedContactRow = page
    .locator(".MuiDataGrid-row", { hasText: newEmployeeName })
    .first();
  await editedContactRow.click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
  await expect(page.getByText(newEmployeeName)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText(role)).toBeVisible();

  // Click delete, confirm, verify contact is gone
  await page.getByTestId("delete-contact").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /^delete$/i }).click();
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await page.getByPlaceholder("Search contacts").fill(newEmployeeName);
  // Wait for a short time to ensure the list updates
  await page.waitForTimeout(1000);
  // Assert that the row is not present
  const deletedRow = page.locator(".MuiDataGrid-row", {
    hasText: newEmployeeName,
  });
  await expect(deletedRow).toHaveCount(0);
});
