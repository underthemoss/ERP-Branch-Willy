import { test, expect } from "@playwright/test";
import { login } from "./shared";

test("user must be authenticated", async ({ page }) => {
  await login({ page });
  await expect(page.getByText("Welcome Back", { exact: false })).toBeVisible();
});
