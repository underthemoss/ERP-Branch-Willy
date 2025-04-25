import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: "http://localhost:3000/es-erp/",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
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
