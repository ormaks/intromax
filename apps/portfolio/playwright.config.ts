import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/*
 * Smoke e2e for the portfolio. Runs against a production build (`next build`
 * + `next start`), not `next dev` — dev-mode overlays and HMR make timing
 * checks like the preloader flaky.
 *
 * Browser: the locally installed Google Chrome (`channel: "chrome"`) rather
 * than Playwright's bundled Chromium, whose download CDN wasn't reachable
 * from the dev machine. A CI runner that can install browsers can set
 * PLAYWRIGHT_CHANNEL="" to use the bundled one instead.
 */
const channel = process.env.PLAYWRIGHT_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        ...(channel ? { channel } : {}),
      },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
