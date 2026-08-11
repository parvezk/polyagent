import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentSession } from "../src/types.js";

const dependencies = vi.hoisted(() => ({
  currentUserId: vi.fn(),
  list: vi.fn(),
  statePaths: [] as string[],
  toDbRow: vi.fn(),
  upsertSessions: vi.fn(),
}));

vi.mock("@/lib/core", () => ({
  STATE_PATH: "/home/test/.polyagent/state.json",
  StateStore: class {
    constructor(path: string) {
      dependencies.statePaths.push(path);
    }

    list() {
      return dependencies.list();
    }
  },
}));

vi.mock("@/lib/sessions-store", () => ({
  currentUserId: dependencies.currentUserId,
  toDbRow: dependencies.toDbRow,
  upsertSessions: dependencies.upsertSessions,
}));

import { POST } from "../web/app/api/import/route";

const sessions: AgentSession[] = [
  {
    id: "session-1",
    vendor: "claude",
    status: "running",
    dispatchedAt: "2026-07-11T12:00:00.000Z",
  },
  {
    id: "session-2",
    vendor: "jules",
    label: "Fix import",
    status: "completed",
    outputUrl: "https://example.test/pull/2",
    dispatchedAt: "2026-07-11T13:00:00.000Z",
    lastPolled: "2026-07-11T14:00:00.000Z",
  },
];

describe("POST /api/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.statePaths.length = 0;
    dependencies.currentUserId.mockResolvedValue("user-1");
    dependencies.list.mockReturnValue(sessions);
    dependencies.toDbRow.mockImplementation((session: AgentSession, userId: string) => ({
      id: session.id,
      user_id: userId,
      vendor: session.vendor,
      label: session.label ?? null,
      status: session.status,
      output_url: session.outputUrl ?? null,
      first_message: session.firstMessage ?? null,
      dispatched_at: session.dispatchedAt,
      last_polled: session.lastPolled ?? null,
    }));
    dependencies.upsertSessions.mockResolvedValue(undefined);
  });

  it("rejects an unauthenticated import before reading local state", async () => {
    dependencies.currentUserId.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Not authenticated" });
    expect(dependencies.list).not.toHaveBeenCalled();
    expect(dependencies.upsertSessions).not.toHaveBeenCalled();
  });

  it("maps user-scoped rows and persists them in one bulk operation", async () => {
    const response = await POST();

    expect(dependencies.statePaths).toEqual(["/home/test/.polyagent/state.json"]);
    expect(dependencies.toDbRow).toHaveBeenCalledTimes(2);
    expect(dependencies.toDbRow).toHaveBeenNthCalledWith(1, sessions[0], "user-1");
    expect(dependencies.toDbRow).toHaveBeenNthCalledWith(2, sessions[1], "user-1");
    expect(dependencies.upsertSessions).toHaveBeenCalledTimes(1);
    expect(dependencies.upsertSessions).toHaveBeenCalledWith([
      {
        id: "session-1",
        user_id: "user-1",
        vendor: "claude",
        label: null,
        status: "running",
        output_url: null,
        first_message: null,
        dispatched_at: "2026-07-11T12:00:00.000Z",
        last_polled: null,
      },
      {
        id: "session-2",
        user_id: "user-1",
        vendor: "jules",
        label: "Fix import",
        status: "completed",
        output_url: "https://example.test/pull/2",
        first_message: null,
        dispatched_at: "2026-07-11T13:00:00.000Z",
        last_polled: "2026-07-11T14:00:00.000Z",
      },
    ]);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ imported: 2 });
  });

  it("skips database work when local state is empty", async () => {
    dependencies.list.mockReturnValue([]);

    const response = await POST();

    expect(dependencies.toDbRow).not.toHaveBeenCalled();
    expect(dependencies.upsertSessions).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ imported: 0 });
  });
});
