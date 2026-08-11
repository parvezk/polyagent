import { describe, it, expect } from "vitest";
import { normalizeSessionStatus } from "../src/utils/status.js";

describe("normalizeSessionStatus", () => {
  it("normalizes running statuses", () => {
    expect(normalizeSessionStatus("running")).toBe("running");
    expect(normalizeSessionStatus("rescheduling")).toBe("running");
    expect(normalizeSessionStatus("in_progress")).toBe("running");
    expect(normalizeSessionStatus("QUEUED")).toBe("running");
    expect(normalizeSessionStatus("PLANNING")).toBe("running");
    expect(normalizeSessionStatus("IN_PROGRESS")).toBe("running");
    expect(normalizeSessionStatus("PAUSED")).toBe("running");
  });

  it("normalizes needs_review statuses", () => {
    expect(normalizeSessionStatus("idle")).toBe("needs_review");
    expect(normalizeSessionStatus("requires_action")).toBe("needs_review");
    expect(normalizeSessionStatus("AWAITING_PLAN_APPROVAL")).toBe("needs_review");
    expect(normalizeSessionStatus("AWAITING_USER_FEEDBACK")).toBe("needs_review");
  });

  it("normalizes completed statuses", () => {
    expect(normalizeSessionStatus("terminated")).toBe("completed");
    expect(normalizeSessionStatus("finished")).toBe("completed");
    expect(normalizeSessionStatus("completed")).toBe("completed");
    expect(normalizeSessionStatus("COMPLETED")).toBe("completed");
  });

  it("normalizes failed statuses", () => {
    expect(normalizeSessionStatus("error")).toBe("failed");
    expect(normalizeSessionStatus("cancelled")).toBe("failed");
    expect(normalizeSessionStatus("failed")).toBe("failed");
    expect(normalizeSessionStatus("FAILED")).toBe("failed");
  });

  it("returns unknown for unmapped statuses", () => {
    expect(normalizeSessionStatus("some_unknown_status")).toBe("unknown");
    expect(normalizeSessionStatus("")).toBe("unknown");
  });
});
