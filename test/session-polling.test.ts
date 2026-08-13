import { describe, expect, it } from "vitest";
import {
  getSessionDetailRefreshInterval,
  getSessionsRefreshInterval,
  isTerminalSessionStatus,
} from "../web/lib/session-polling.js";

describe("session polling intervals", () => {
  it("treats completed and failed as terminal session statuses", () => {
    expect(isTerminalSessionStatus("completed")).toBe(true);
    expect(isTerminalSessionStatus("failed")).toBe(true);
    expect(isTerminalSessionStatus("running")).toBe(false);
    expect(isTerminalSessionStatus("needs_review")).toBe(false);
    expect(isTerminalSessionStatus("unknown")).toBe(false);
  });

  it("keeps polling the sessions list until every session is terminal", () => {
    expect(getSessionsRefreshInterval(undefined)).toBe(3000);
    // Empty must keep polling: list failures also return `{ sessions: [] }`.
    expect(getSessionsRefreshInterval({ sessions: [] })).toBe(3000);
    expect(
      getSessionsRefreshInterval({
        sessions: [{ status: "completed" }, { status: "failed" }],
      }),
    ).toBe(0);
    expect(
      getSessionsRefreshInterval({
        sessions: [{ status: "completed" }, { status: "running" }],
      }),
    ).toBe(3000);
  });

  it("uses refreshed detail data before the initially selected session status", () => {
    expect(
      getSessionDetailRefreshInterval({
        initialStatus: "running",
        refreshedStatus: "completed",
      }),
    ).toBe(0);
    expect(
      getSessionDetailRefreshInterval({
        initialStatus: "completed",
        refreshedStatus: "running",
      }),
    ).toBe(4000);
    expect(
      getSessionDetailRefreshInterval({
        initialStatus: "failed",
      }),
    ).toBe(0);
  });
});
