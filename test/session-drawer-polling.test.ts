import { describe, expect, it } from "vitest";

import { getSessionDrawerRefreshInterval } from "../web/components/session-drawer-polling";

describe("SessionDrawer polling", () => {
  it("polls when detail status resumes from needs_review to running", () => {
    expect(getSessionDrawerRefreshInterval("needs_review", "running")).toBe(3000);
  });

  it("polls after a follow-up is accepted while detail status is still stale", () => {
    expect(getSessionDrawerRefreshInterval("needs_review", "needs_review", true)).toBe(3000);
  });

  it("stops polling when latest detail status is terminal", () => {
    expect(getSessionDrawerRefreshInterval("running", "completed")).toBe(0);
  });
});
