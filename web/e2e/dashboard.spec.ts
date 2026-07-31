import { expect, test, type Page } from "@playwright/test";

const consoleErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  consoleErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const errors = consoleErrors.get(page) ?? [];
  const unexpectedErrors = testInfo.title.includes("API error toast")
    ? errors.filter((error) => !error.includes("status of 503 (Service Unavailable)"))
    : errors;

  expect(unexpectedErrors).toEqual([]);
});

const sessions = [
  {
    id: "session-claude-1",
    vendor: "claude",
    label: "Review the authentication boundary",
    status: "needs_review",
    dispatchedAt: "2026-07-21T12:00:00.000Z",
    lastUpdate: "2026-07-21T12:05:00.000Z",
  },
  {
    id: "session-jules-2",
    vendor: "jules",
    label: "Improve dashboard tests",
    status: "running",
    dispatchedAt: "2026-07-21T12:10:00.000Z",
    lastUpdate: "2026-07-21T12:15:00.000Z",
  },
];

async function mockSessions(page: Page, mockedSessions = sessions) {
  await page.route("**/api/sessions**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname === "/api/sessions/session-claude-1") {
      await route.fulfill({
        json: {
          session: mockedSessions[0],
          firstMessage: "I found one authentication edge case.",
          messages: [],
        },
      });
      return;
    }

    await route.fulfill({ json: { sessions: mockedSessions } });
  });
}

test("loads the dashboard without external credentials", async ({ page }) => {
  await mockSessions(page, []);

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Coding Agents" })).toBeVisible();
  await expect(page.getByText("No agents dispatched yet.")).toBeVisible();
});

test("opens the new agent modal", async ({ page }) => {
  await mockSessions(page, []);
  await page.goto("/");

  await page.getByRole("button", { name: "+ New Agent" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "New agent" })).toBeVisible();
  await expect(dialog.getByText("Launch a cloud agent on any connected vendor.")).toBeVisible();
});

test("renders mocked sessions and opens the selected session drawer", async ({ page }) => {
  await mockSessions(page);
  await page.goto("/");

  await expect(page.getByText("Review the authentication boundary")).toBeVisible();
  await expect(page.getByText("Improve dashboard tests")).toBeVisible();

  await page.getByRole("row", { name: /Review the authentication boundary/ }).click();

  const drawer = page.getByRole("dialog");
  await expect(drawer.getByText("session-claude-1")).toBeVisible();
  await expect(drawer.getByText("I found one authentication edge case.")).toBeVisible();
});

test("shows an API error toast when CLI import fails", async ({ page }) => {
  await mockSessions(page, []);
  await page.route("**/api/import", async (route) => {
    await route.fulfill({ status: 503, json: { error: "CLI import unavailable" } });
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Import CLI sessions" }).click();

  await expect(page.getByText("CLI import unavailable")).toBeVisible();
});
