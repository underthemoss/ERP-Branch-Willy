import { config } from "dotenv";
config();
import { expect, Page } from "playwright/test";
export const login = async ({ page }: { page: Page }) => {
  await page.goto("/");

  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("fleetconfiguration.pim-integration-test-ady@inbox.testmail.app");

  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await page
    .getByRole("textbox", { name: "Password" })
    .fill(process.env.TEST_USER_PASSWORD || "");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Welcome Back", { exact: false })).toBeVisible({
    timeout: 40_000,
  });
};
