import { test, expect } from "@playwright/test";
import { login } from "../shared";
import { subDays, format } from "date-fns";

test.skip("delete contacts updated on each of the last 20 days", async ({
  page,
}) => {
  await login({ page });

  // Go to Contacts via nav
  await page.getByTestId("expand-nav-contacts").click();
  await page.waitForTimeout(500);
  await page.getByTestId("nav-contacts").click();

  // Wait for contact list to be visible
  await expect(page.getByTestId("contact-list")).toBeVisible();

  // For each of the last 20 days (excluding today)
  for (let i = 1; i <= 20; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");

    // Enter the date in the search bar
    const searchInput = page.getByPlaceholder("Search contacts");
    await searchInput.fill(date);
    await page.waitForTimeout(500); // Wait for search to filter

    // Delete all contacts found for this date
    while (true) {
      // Find the first row in the filtered list
      const row = page.locator(".MuiDataGrid-row").first();
      if (!(await row.isVisible({ timeout: 1000 }).catch(() => false))) break;

      // Click the row to go to the contact detail page
      await row.click();

      // Wait for detail page, click delete
      await expect(page.getByTestId("delete-contact")).toBeVisible();
      await page.getByTestId("delete-contact").click();

      // Confirm deletion in dialog
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: /^delete$/i }).click();

      // After deletion, should return to contact management page
      await expect(page.getByTestId("contact-list")).toBeVisible();

      // Re-enter the date in the search bar (since the page reloads)
      await searchInput.fill(date);
      await page.waitForTimeout(500);
    }

    // Clear the search bar for the next date
    await searchInput.fill("");
    await page.waitForTimeout(200);
  }
});
