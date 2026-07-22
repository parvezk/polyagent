import { test, expect } from "@playwright/test";
import { mockSessions, mockImportError, SESSIONS } from "./fixtures";

test.describe("dashboard", () => {
  test("renders the shell, hero and heading", async ({ page }) => {
    await mockSessions(page, []);
    await page.goto("/");

    // Sticky branded header.
    await expect(page.getByRole("banner").getByText("PolyAgent")).toBeVisible();
    // Page heading + vendor hero copy.
    await expect(page.getByRole("heading", { name: "Coding Agents" })).toBeVisible();
    await expect(page.getByText("vendor-agnostic control plane", { exact: false })).toBeVisible();
    // Empty state when no sessions.
    await expect(page.getByText("No agents dispatched yet.")).toBeVisible();
  });

  test("opens the New Agent modal", async ({ page }) => {
    await mockSessions(page, []);
    await page.goto("/");

    await page.getByRole("button", { name: "+ New Agent" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "New agent" })).toBeVisible();
    await expect(dialog.getByText("Launch a cloud agent on any connected vendor.")).toBeVisible();
    // Vendor tiles are present.
    await expect(dialog.getByRole("button", { name: "Claude" })).toBeVisible();
  });

  test("renders mocked sessions in the table", async ({ page }) => {
    await mockSessions(page);
    await page.goto("/");

    for (const s of SESSIONS) {
      await expect(page.getByText(s.label)).toBeVisible();
    }
    // Status rendering: the needs_review row surfaces the loud badge (exact match
    // avoids colliding with the telemetry strip's "1 needs review" counter).
    await expect(page.getByText("needs review", { exact: true })).toBeVisible();
  });

  test("selecting a row opens the session drawer", async ({ page }) => {
    await mockSessions(page);
    await page.goto("/");

    const target = SESSIONS[0];
    await page.getByText(target.label).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    // Drawer shows the selected session's title and id.
    await expect(drawer.getByText(target.label)).toBeVisible();
    await expect(drawer.getByText(target.id)).toBeVisible();
  });

  test("shows an error toast when import fails", async ({ page }) => {
    await mockSessions(page, []);
    await mockImportError(page, "State file is corrupt");
    await page.goto("/");

    await page.getByRole("button", { name: "Import CLI sessions" }).click();

    await expect(page.getByText("State file is corrupt")).toBeVisible();
  });
});
