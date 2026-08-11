import { describe, expect, it } from "vitest";

import { getDraftAfterFailedFollowup } from "../web/components/session-drawer-followup";

describe("SessionDrawer follow-up rollback", () => {
  it("restores the failed message when no newer draft exists", () => {
    expect(getDraftAfterFailedFollowup("", "failed message")).toBe("failed message");
  });

  it("preserves a newer draft typed while the failed send was pending", () => {
    expect(getDraftAfterFailedFollowup("newer draft", "failed message")).toBe("newer draft");
  });
});
