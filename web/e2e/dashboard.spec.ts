import { expect, test } from "@playwright/test";
import { mockApi, SAMPLE_SESSIONS } from "./helpers";

test.describe("dashboard", () => {
  test("renders the shell and empty state with no sessions", async ({ page }) => {
    await mockApi(page, { sessions: [] });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Coding Agents" })).toBeVisible();
    // Vendor hero pitch + the orchestrated vendors.
    await expect(page.getByText("A vendor-agnostic control plane")).toBeVisible();
    await expect(page.getByText("No agents dispatched yet.")).toBeVisible();
  });

  test("renders mocked sessions in the table", async ({ page }) => {
    await mockApi(page, { sessions: SAMPLE_SESSIONS });
    await page.goto("/");

    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(SAMPLE_SESSIONS.length);
    await expect(page.getByText("Audit the repo for XSS flaws")).toBeVisible();
    await expect(page.getByText("Add pagination to the sessions API")).toBeVisible();
    // Telemetry strip reflects the mocked statuses.
    await expect(page.getByText("1 running")).toBeVisible();
    await expect(page.getByText("1 needs review")).toBeVisible();
  });

  test("clicking a row opens the session drawer", async ({ page }) => {
    await mockApi(page, { sessions: SAMPLE_SESSIONS });
    await page.goto("/");

    await page.getByRole("cell", { name: "Audit the repo for XSS flaws" }).click();

    // The drawer opens as a dialog labelled by the session, showing its id + follow-up composer.
    const drawer = page.getByRole("dialog", { name: "Audit the repo for XSS flaws" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("sess_claude_0001")).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Send follow-up" })).toBeVisible();
    await expect(
      drawer.getByPlaceholder("Send a follow-up to steer the agent…"),
    ).toBeVisible();
  });
});
