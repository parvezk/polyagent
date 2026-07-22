import type { Page, Route } from "@playwright/test";
import type { SessionView } from "@/lib/view";

// A couple of ready-made sessions covering the "needs review" highlight + a running row.
export const SAMPLE_SESSIONS: SessionView[] = [
  {
    id: "sess_claude_0001",
    vendor: "claude",
    label: "Audit the repo for XSS flaws",
    status: "needs_review",
    dispatchedAt: "2026-07-22T09:00:00.000Z",
    lastUpdate: "2026-07-22T09:05:00.000Z",
    summary: "Found two potential issues.",
    firstMessage: "Starting the security audit…",
  },
  {
    id: "sess_jules_0002",
    vendor: "jules",
    label: "Add pagination to the sessions API",
    status: "running",
    dispatchedAt: "2026-07-22T08:30:00.000Z",
    lastUpdate: "2026-07-22T08:55:00.000Z",
  },
];

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

/**
 * Stub every server route the dashboard touches so nothing hits real Supabase, OAuth, or
 * the Claude/Jules/Cursor/Gemini vendor APIs. Pass overrides to change specific responses.
 */
export async function mockApi(
  page: Page,
  opts: {
    sessions?: SessionView[];
    importResponse?: { status: number; body: unknown };
    dispatchResponse?: { status: number; body: unknown };
  } = {},
) {
  const sessions = opts.sessions ?? [];

  // List — polled by the table + telemetry strip (deduped, same SWR key).
  await page.route("**/api/sessions", (route) => json(route, { sessions }));

  // Detail — opened by the drawer on row click.
  await page.route("**/api/sessions/*", (route) => {
    const url = new URL(route.request().url());
    const id = url.pathname.split("/").pop();
    const session = sessions.find((s) => s.id === id);
    return json(route, {
      session,
      firstMessage: session?.firstMessage,
      messages: [],
    });
  });

  // Import — success by default; override to exercise the error toast.
  await page.route("**/api/import", (route) =>
    opts.importResponse
      ? json(route, opts.importResponse.body, opts.importResponse.status)
      : json(route, { imported: 3 }),
  );

  // Dispatch — new-agent launch.
  await page.route("**/api/dispatch", (route) =>
    opts.dispatchResponse
      ? json(route, opts.dispatchResponse.body, opts.dispatchResponse.status)
      : json(route, { session: { id: "sess_new_0003" } }),
  );

  // Jules connected repos (only fetched when the Jules vendor is picked).
  await page.route("**/api/jules/sources", (route) =>
    json(route, { sources: [{ repo: "acme/widgets", defaultBranch: "main" }] }),
  );
}
