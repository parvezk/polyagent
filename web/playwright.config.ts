import { defineConfig, devices } from "@playwright/test";

// Dedicated port so the E2E server never collides with a hand-started `npm run dev`.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Boot the Next.js dev server. Supabase env vars are intentionally left unset so the
    // auth middleware bypasses in dev (see lib/supabase/middleware.ts) — tests never touch
    // real Supabase, OAuth, or vendor APIs; every API call is mocked at the network layer.
    command: `npm run dev -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
