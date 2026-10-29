import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:5173" },
  webServer: { command: "pnpm dev", url: "http://127.0.0.1:5173", reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: "webkit-ipad", use: { ...devices["iPad Pro 11"], browserName: "webkit" } },
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
