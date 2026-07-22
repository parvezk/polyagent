import { expect, test } from "@playwright/test";
import { mockApi } from "./helpers";

test.describe("new agent modal", () => {
  test("opens the modal and shows the launch form", async ({ page }) => {
    await mockApi(page, { sessions: [] });
    await page.goto("/");

    await page.getByRole("button", { name: "+ New Agent" }).click();

    await expect(page.getByRole("heading", { name: "New agent" })).toBeVisible();
    await expect(page.getByText("Launch a cloud agent on any connected vendor.")).toBeVisible();
    await expect(page.getByPlaceholder("owner/repo")).toBeVisible();

    // Launch is disabled until there's a task prompt.
    const launch = page.getByRole("button", { name: "Launch agent" });
    await expect(launch).toBeDisabled();
    await page.getByPlaceholder(/Identify any security/).fill("Refactor the auth middleware");
    await expect(launch).toBeEnabled();
  });
});
