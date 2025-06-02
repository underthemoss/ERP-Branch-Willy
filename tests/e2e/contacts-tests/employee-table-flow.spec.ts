import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { login } from "../shared";

test("employee table create, verify, delete flow", async ({ page }) => {
  await login({ page });

  // Expand the Contacts nav item, then click the Employees subitem
  await page.getByTestId("expand-nav-contacts").click();
  await page.waitForTimeout(500);
  const employeesNav = page.getByTestId("nav-contacts-employees");
  await employeesNav.waitFor({ state: "visible" });
  await employeesNav.click();
  await expect(page.getByTestId("employee-list")).toBeVisible();

  // First, create a business contact to assign the employee to
  await page.getByTestId("nav-contacts").click();
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

  // Now go back to the employee table (no need to expand again)
  await employeesNav.click();
  await expect(page.getByTestId("employee-list")).toBeVisible();

  // Create an employee
  await page.getByRole("button", { name: "+ Add Employee" }).click();

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

  // Navigate back to the employee table (no need to expand again)
  await employeesNav.click();
  await expect(page.getByTestId("employee-list")).toBeVisible();

  // Search for the employee, click the row, verify details
  await page.getByPlaceholder("Search employees").fill(employeeName);
  await expect(page.getByText(employeeName)).toBeVisible({ timeout: 15000 });
  const contactRow = page
    .locator(".MuiDataGrid-row", { hasText: employeeName })
    .first();
  await contactRow.click();
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
  await expect(page.getByText(employeeName)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText(role)).toBeVisible();

  // Delete the employee
  await page.getByTestId("delete-contact").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /^delete$/i }).click();

  // After deletion, go back to the employee table (no need to expand again)
  await employeesNav.click();
  await expect(page.getByTestId("employee-list")).toBeVisible();

  // Search for the employee again, verify they are not present
  await page.getByPlaceholder("Search employees").fill(employeeName);
  await page.waitForTimeout(1000);
  const deletedRow = page.locator(".MuiDataGrid-row", {
    hasText: employeeName,
  });
  await expect(deletedRow).toHaveCount(0);
});
