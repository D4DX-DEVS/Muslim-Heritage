import { defineConfig, devices } from "@playwright/test";

// Runs against `next dev` (local D1/R2 from .wrangler, seeded by `npm run migrate:import`).
// Admin tests need E2E_ADMIN_PASSWORD matching ADMIN_PASSWORD_HASH in .dev.vars.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npx next dev -p 3100", url: `${baseURL}/robots.txt`, reuseExistingServer: true, timeout: 180_000 },
});
