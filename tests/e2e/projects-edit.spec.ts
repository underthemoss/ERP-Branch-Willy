import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { login } from "./shared";

test.describe("Project Edit Flow", () => {
  test("should edit a project and reflect changes", async ({ page }) => {
    // Log in as test user
    await login({ page });

    // Generate realistic project data
    const originalName = faker.company.name();
    const originalCode = faker.string.alphanumeric({ length: 6 }).toUpperCase();
    const updatedName = `${originalName} ${faker.word.adjective()}`;
    const updatedCode = `${originalCode}${faker.string.alpha({ length: 1 }).toUpperCase()}`;
    const updatedDescription = faker.company.catchPhrase();

    // Navigate to the projects list via the nav bar using data-testid
    await page.getByTestId("nav-projects").click();

    // Create a new project via UI
    await page.getByRole("button", { name: "+ Create Project" }).click();
    await page.getByLabel("Project Name").fill(originalName);
    await page.getByLabel("Project Code").fill(originalCode);
    await page.getByLabel("Description").fill("Initial description");
    await page.getByRole("button", { name: "Create Project" }).click();

    // Wait for success alert and redirect to project detail page
    await expect(page.getByTestId("project-create-success")).toBeVisible();

    // Click the edit button on the project detail page to go to the edit form
    await page
      .getByTestId("project-details-edit-btn")
      .click({ timeout: 30_000 });

    // Edit the project fields
    await page.getByLabel("Project Name").fill(updatedName);
    await page.getByLabel("Project Code").fill(updatedCode);
    await page.getByLabel("Description").fill(updatedDescription);
    await page.getByRole("button", { name: "Update Project" }).click();

    // Wait for success alert
    const successAlert = page.getByTestId("project-edit-success");
    await expect(successAlert).toBeVisible();

    // Wait for redirect to project detail page (allow up to 20s for slow environments)
    // await page.waitForURL(`/app/1/projects/${projectId}`, { timeout: 20000 });

    // Verify the updated details are shown
    await expect(
      page.getByRole("heading", { name: updatedName })
    ).toBeVisible();
    await expect(page.getByText(updatedCode)).toBeVisible();
    await expect(page.getByText(updatedDescription)).toBeVisible();
  });
});
