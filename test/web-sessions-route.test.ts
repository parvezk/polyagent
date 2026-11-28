import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DbSession } from "../web/lib/sessions-store";

const mocks = vi.hoisted(() => ({
  buildAdapter: vi.fn(),
  getStatus: vi.fn(),
  listSessions: vi.fn(),
  patchSession: vi.fn(),
  upsertSessions: vi.fn(),
}));

vi.mock("@/lib/core", () => ({
  buildAdapter: mocks.buildAdapter,
}));

vi.mock("@/lib/sessions-store", () => ({
  listSessions: mocks.listSessions,
  patchSession: mocks.patchSession,
  upsertSessions: mocks.upsertSessions,
}));

const { GET } = await import("../web/app/api/sessions/route");

function makeSession(overrides: Partial<DbSession> = {}): DbSession {
  return {
    id: "session-1",
    user_id: "user-1",
    vendor: "claude",
    label: "Session 1",
    status: "running",
    output_url: null,
    first_message: null,
    dispatched_at: "2026-08-10T00:00:00.000Z",
    last_polled: "2026-08-10T00:00:03.000Z",
    ...overrides,
  };
}

describe("GET /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildAdapter.mockReturnValue({ getStatus: mocks.getStatus });
    mocks.patchSession.mockResolvedValue(undefined);
  });

  it("does not upsert an active session solely because the live poll timestamp changed", async () => {
    mocks.listSessions.mockResolvedValue([makeSession()]);
    mocks.getStatus.mockResolvedValue({
      status: "running",
      lastUpdate: new Date("2026-08-10T00:00:06.000Z"),
      summary: "Still running",
    });

    const response = await GET();
    const body = await response.json();

    expect(mocks.getStatus).toHaveBeenCalledWith("session-1");
    expect(mocks.patchSession).not.toHaveBeenCalled();
    expect(mocks.upsertSessions).not.toHaveBeenCalled();
    expect(body.sessions[0]).toMatchObject({
      id: "session-1",
      status: "running",
      lastUpdate: "2026-08-10T00:00:03.000Z",
      summary: "Still running",
    });
  });

  it("keeps last-known status when the adapter soft-fails with unknown", async () => {
    mocks.listSessions.mockResolvedValue([makeSession({ status: "needs_review" })]);
    mocks.getStatus.mockResolvedValue({
      status: "unknown",
      lastUpdate: new Date("2026-08-10T00:00:06.000Z"),
      summary: undefined,
    });

    const response = await GET();
    const body = await response.json();

    expect(mocks.getStatus).toHaveBeenCalledWith("session-1");
    expect(mocks.patchSession).not.toHaveBeenCalled();
    expect(body.sessions[0]).toMatchObject({
      id: "session-1",
      status: "needs_review",
      lastUpdate: "2026-08-10T00:00:03.000Z",
    });
  });
});
