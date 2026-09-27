import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
    testDir: "./tests/browser",
    timeout: 120000,
    expect: { timeout: 20000 },
    workers: 1,
    use: {
        baseURL: baseURL || "http://localhost:3005",
        viewport: { width: 1440, height: 1000 },
        trace: "retain-on-failure",
    },
    webServer: baseURL
        ? undefined
        : {
              command: "npm run dev",
              url: "http://localhost:3005",
              reuseExistingServer: !process.env.CI,
              timeout: 120000,
          },
});
