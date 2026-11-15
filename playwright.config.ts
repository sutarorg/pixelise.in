import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the Pixelise end-to-end suite.
 *
 * The suite runs against a **production build** (`next start`), never against
 * production data. It refuses to start if `E2E_BASE_URL` points at the live domain.
 *
 * Prerequisites:
 *   1. `npm run build`
 *   2. `npm run test:e2e`  (starts the server on 3100 if one is not already there)
 *
 * Browser projects are deliberately asymmetric: Chromium runs the full functional
 * suite, Firefox/WebKit run the `@smoke` subset, and mobile runs the `@mobile`
 * subset. Running all 3 browsers across every spec would multiply CI time without
 * adding signal. See docs/research/e2e-testing-research.md §3.
 */

const PORT = Number(process.env.E2E_PORT ?? 3100);
const HOST = process.env.E2E_HOST ?? "127.0.0.1";
const baseURL = process.env.E2E_BASE_URL ?? `http://${HOST}:${PORT}`;

const target = new URL(baseURL);
const productionHosts = ["pixelise.in", "www.pixelise.in"];

if (productionHosts.includes(target.hostname)) {
  throw new Error(
    "Refusing to run the E2E suite against the production domain. " +
      "Set E2E_BASE_URL to a staging or local URL. Payment, credit and auth tests must never touch live data.",
  );
}

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalTimeout: 45 * 60 * 1000,
  timeout: 45_000,
  expect: {
    timeout: 7_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" },
  },
  reporter: process.env.CI
    ? [
        ["list"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["json", { outputFile: "test-results/report.json" }],
      ]
    : [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    colorScheme: "light",
    reducedMotion: "reduce",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "firefox-smoke",
      grep: /@smoke/,
      use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "webkit-smoke",
      grep: /@smoke/,
      use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile-chromium",
      grep: /@mobile/,
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: `npx next start -p ${PORT} -H ${HOST}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
