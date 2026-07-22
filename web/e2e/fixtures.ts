import type { Page, Route } from "@playwright/test";
import type { SessionView } from "@/lib/view";

// Deterministic fixtures. Dates are fixed so relative-time rendering is stable
// enough for assertions that only check labels/status, not the "Xm ago" text.
export const SESSIONS: SessionView[] = [
  {
    id: "sess_claude_0001",
    vendor: "claude",
    label: "Fix the login redirect loop",
    status: "running",
    dispatchedAt: "2026-07-22T10:00:00.000Z",
    lastUpdate: "2026-07-22T10:05:00.000Z",
    firstMessage: "Starting work on the login redirect loop.",
  },
  {
    id: "sess_jules_0002",
    vendor: "jules",
    label: "Add pagination to the sessions API",
    status: "needs_review",
    dispatchedAt: "2026-07-22T09:00:00.000Z",
    lastUpdate: "2026-07-22T09:30:00.000Z",
    firstMessage: "Opened a PR with cursor-based pagination.",
  },
];

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

/**
 * Mock the sessions list endpoint (`GET /api/sessions`). Never hits Supabase.
 * Registered before the detail route so the more specific pattern below wins.
 */
export async function mockSessions(page: Page, sessions: SessionView[] = SESSIONS) {
  await page.route(/\/api\/sessions(\?.*)?$/, (route) => json(route, { sessions }));
  // Detail endpoint (`GET /api/sessions/:id`) used by the drawer.
  await page.route(/\/api\/sessions\/[^/?]+/, (route) => {
    const url = new URL(route.request().url());
    const id = url.pathname.split("/").pop();
    const session = sessions.find((s) => s.id === id) ?? sessions[0];
    return json(route, {
      session,
      firstMessage: session.firstMessage,
      messages: [{ role: "agent", content: "Working on it…", timestamp: session.lastUpdate }],
    });
  });
}

/** Mock the import endpoint to fail, so the error toast path is exercised. */
export async function mockImportError(page: Page, message = "State file is corrupt") {
  await page.route(/\/api\/import$/, (route) => json(route, { error: message }, 500));
}

/** Mock the import endpoint to succeed with a given count. */
export async function mockImportSuccess(page: Page, imported: number) {
  await page.route(/\/api\/import$/, (route) => json(route, { imported }));
}
