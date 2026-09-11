import { defineConfig } from "@playwright/test";

export type TenantId = "apex-technology";

const port = 5412;
const tenantId: TenantId = "apex-technology";

export default defineConfig<{ tenantId: TenantId }>({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 120_000,
  expect: { timeout: 10_000 },
  outputDir: "build/e2e/artifacts",
  reporter: [
    ["list"],
    ["json", { outputFile: "build/e2e/results.json" }],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    browserName: "chromium",
    serviceWorkers: "block",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    locale: "en-GB",
  },
  webServer: {
    // Invoke the installed Vite CLI with the current Node, not npm.cmd or a dev server.
    command: `"${process.execPath}" node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort --outDir dist`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: `${tenantId}-desktop`,
      use: {
        viewport: { width: 1440, height: 960 },
        isMobile: false,
        hasTouch: false,
        tenantId,
        baseURL: `http://127.0.0.1:${port}`,
      },
    },
    {
      name: `${tenantId}-mobile`,
      use: {
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
        tenantId,
        baseURL: `http://127.0.0.1:${port}`,
      },
    },
  ],
});
