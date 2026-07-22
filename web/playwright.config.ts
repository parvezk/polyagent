import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

// E2E tests run against `next dev` with NO Supabase/PostHog/vendor config. The auth
// middleware fails closed by default, so we opt into its explicit local-dev bypass
// (AUTH_DEV_BYPASS) and mock every /api/* route from the tests — nothing touches real
// Supabase, OAuth, or the Claude/Jules/Cursor/Gemini vendor APIs.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Opt into the middleware's local-dev auth bypass (see lib/supabase/middleware.ts).
      AUTH_DEV_BYPASS: "true",
    },
  },
});
