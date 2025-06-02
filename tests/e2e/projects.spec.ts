import { test, expect } from "@playwright/test";
import { login } from "./shared";
import { faker } from "@faker-js/faker";

test.describe("Projects E2E", () => {
  // ... (other tests unchanged)

  test("should create a project, show success, and redirect to details page", async ({
    page,
  }) => {
    await login({ page });

    // Wait for sidebar/nav to be ready
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 10000 });

    // Navigate to Projects via sidebar or navigation
    const projectsLink = page.getByRole("link", { name: /projects/i });
    await expect(projectsLink).toBeVisible({ timeout: 10000 });
    await projectsLink.click();

    await expect(page).toHaveURL(/\/projects/);

    // Click the create project button
    await page.getByRole("button", { name: /create project/i }).click();

    // Generate random values
    const name = faker.company.name() + " " + faker.string.alphanumeric(6);
    const code = faker.string.alphanumeric(8).toUpperCase();
    const description = faker.lorem.sentence();

    // Fill out the form
    await page.getByLabel(/project name/i).fill(name);
    await page.getByLabel(/project code/i).fill(code);
    await page.getByLabel(/description/i).fill(description);
    await page.getByRole("button", { name: /create project/i }).click();

    // Wait for and assert the success message
    await expect(page.getByTestId("project-create-success")).toBeVisible({
      timeout: 10000,
    });

    // Wait for redirect (should happen after 1 second)
    await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9]+/, { timeout: 5000 });

    // Assert the project details page is visible (heading or details card)
    const details = page.locator('[data-testid="project-details"]');
    await expect(details).toBeVisible({ timeout: 10000 });

    // Validate the values in the details page
    await expect(details.getByRole("heading", { name })).toBeVisible();
    await expect(details).toContainText(code);
    await expect(details).toContainText(description);
  });

  test("should create and then delete a project", async ({ page }) => {
    await login({ page });

    // Wait for sidebar/nav to be ready
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 10000 });

    // Navigate to Projects via sidebar or navigation
    const projectsLink = page.getByRole("link", { name: /projects/i });
    await expect(projectsLink).toBeVisible({ timeout: 10000 });
    await projectsLink.click();

    await expect(page).toHaveURL(/\/projects/);

    // Click the create project button
    await page.getByRole("button", { name: /create project/i }).click();

    // Generate random values
    const name = faker.company.name() + " " + faker.string.alphanumeric(6);
    const code = faker.string.alphanumeric(8).toUpperCase();
    const description = faker.lorem.sentence();

    // Fill out the form
    await page.getByLabel(/project name/i).fill(name);
    await page.getByLabel(/project code/i).fill(code);
    await page.getByLabel(/description/i).fill(description);
    await page.getByRole("button", { name: /create project/i }).click();

    // Wait for and assert the success message
    await expect(page.getByTestId("project-create-success")).toBeVisible({
      timeout: 10000,
    });

    // Wait for redirect (should happen after 1 second)
    await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9]+/, { timeout: 5000 });

    // Assert the project details page is visible (heading or details card)
    const details = page.locator('[data-testid="project-details"]');
    await expect(details).toBeVisible({ timeout: 10000 });

    // Validate the values in the details page
    await expect(details.getByRole("heading", { name })).toBeVisible();
    await expect(details).toContainText(code);
    await expect(details).toContainText(description);

    // --- DELETE PROJECT ---

    // Click the delete button using data-testid
    await page.getByTestId("project-details-delete-btn").click();

    // Confirm the deletion in the dialog using data-testid
    await page.getByTestId("project-details-confirm-delete-btn").click();

    // Wait for redirect to the projects list
    await expect(page).toHaveURL(/\/projects/);

    // Optionally, check that the deleted project does not appear in the list
    await expect(page.getByText(name)).not.toBeVisible();

    // --- FILTER FOR DELETED PROJECTS AND VERIFY ---

    // Find and open the status filter select using data-testid
    const statusFilter = page.getByTestId("project-status-filter");
    await statusFilter.click();

    // Select the "Deleted" option
    await page.getByRole("option", { name: "Deleted" }).click();

    // Search for the deleted project by name
    await page.getByPlaceholder("Search project by name").fill(name);

    // Verify the deleted project appears in the filtered list
    const projectList = page.getByTestId("project-list");
    const deletedRow = projectList.getByText(name);
    await deletedRow.scrollIntoViewIfNeeded();
    await expect(deletedRow).toBeVisible();
  });
});
