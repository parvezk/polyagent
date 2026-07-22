import { expect, test } from "@playwright/test";
import { mockApi } from "./helpers";

test.describe("import CLI sessions", () => {
  test("shows an error toast when the import fails", async ({ page }) => {
    await mockApi(page, {
      sessions: [],
      importResponse: { status: 500, body: { error: "Nothing to import" } },
    });
    await page.goto("/");

    await page.getByRole("button", { name: "Import CLI sessions" }).click();

    await expect(page.getByText("Nothing to import")).toBeVisible();
  });

  test("shows a success toast when the import succeeds", async ({ page }) => {
    await mockApi(page, {
      sessions: [],
      importResponse: { status: 200, body: { imported: 3 } },
    });
    await page.goto("/");

    await page.getByRole("button", { name: "Import CLI sessions" }).click();

    await expect(page.getByText("Imported 3 CLI sessions")).toBeVisible();
  });
});
