import { defineConfig } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 15000,
  },
  use: {
    actionTimeout: 10000,
    navigationTimeout: 45000,
    baseURL: "http://localhost:3000/",
    headless: true,
  },
  timeout: 60000,
  retries: 2,
  webServer: {
    command: "npm run dev",
    port: 3000,
    timeout: 120000,
    stderr: "pipe",
    stdout: "pipe",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
