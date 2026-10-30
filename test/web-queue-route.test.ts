import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DbSession } from "../web/lib/sessions-store";
import type { QueueItem, QueueResponse } from "../web/lib/queue";

const mocks = vi.hoisted(() => ({
  buildAdapter: vi.fn(),
  getStatus: vi.fn(),
  getOutput: vi.fn(),
  listSessions: vi.fn(),
  patchSession: vi.fn(),
}));

vi.mock("@/lib/core", () => ({ buildAdapter: mocks.buildAdapter }));

vi.mock("@/lib/sessions-store", () => ({
  listSessions: mocks.listSessions,
  patchSession: mocks.patchSession,
}));

const { GET } = await import("../web/app/api/queue/route");

function makeSession(overrides: Partial<DbSession> = {}): DbSession {
  return {
    id: "s1",
    user_id: "user-1",
    vendor: "claude",
    label: "Session",
    status: "running",
    output_url: null,
    first_message: null,
    dispatched_at: "2026-10-30T00:00:00.000Z",
    last_polled: "2026-10-30T00:00:03.000Z",
    dismissed_at: null,
    ...overrides,
  };
}

type Live = { status: string; needsInput?: boolean; summary?: string };

// Per-session live status (or Error to throw) and output messages.
function setup(
  sessions: DbSession[],
  live: Record<string, Live | Error> = {},
  messages: Record<string, { role: string; content: string }[] | Error> = {},
) {
  mocks.listSessions.mockResolvedValue(sessions);
  mocks.getStatus.mockImplementation(async (id: string) => {
    const l = live[id];
    if (l instanceof Error) throw l;
    const s = sessions.find((x) => x.id === id)!;
    return {
      status: l?.status ?? s.status,
      needsInput: l?.needsInput ?? false,
      summary: l?.summary,
      lastUpdate: new Date("2026-10-30T00:00:09.000Z"),
    };
  });
  mocks.getOutput.mockImplementation(async (id: string) => {
    const m = messages[id];
    if (m instanceof Error) throw m;
    return {
      sessionId: id,
      vendor: "claude",
      messages: (m ?? []).map((x) => ({ ...x, timestamp: new Date() })),
    };
  });
}

async function fetchQueue(): Promise<QueueResponse> {
  const res = await GET();
  return (await res.json()) as QueueResponse;
}

function byId(body: QueueResponse): Record<string, QueueItem> {
  return Object.fromEntries(body.items.map((i) => [i.id, i]));
}

describe("GET /api/queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildAdapter.mockReturnValue({ getStatus: mocks.getStatus, getOutput: mocks.getOutput });
    mocks.patchSession.mockResolvedValue(undefined);
  });

  it("groups sessions by what needs the human and counts them", async () => {
    setup(
      [
        makeSession({ id: "asks", status: "running" }),
        makeSession({ id: "review-me", status: "needs_review" }),
        makeSession({ id: "done", status: "completed" }),
        makeSession({ id: "broke", status: "failed" }),
        makeSession({ id: "mystery", status: "unknown" }),
        makeSession({ id: "busy", status: "running" }),
      ],
      { asks: { status: "running", needsInput: true } },
    );

    const body = await fetchQueue();
    const items = byId(body);

    expect(items.asks).toMatchObject({ group: "waiting", needsInput: true, status: "running" });
    expect(items["review-me"].group).toBe("waiting");
    expect(items.done.group).toBe("review");
    expect(items.broke.group).toBe("failed");
    expect(items.mystery.group).toBe("running");
    expect(items.busy.group).toBe("running");
    expect(body.counts).toEqual({ waiting: 2, review: 1, running: 2, failed: 1 });
  });

  it("excludes dismissed sessions", async () => {
    setup([
      makeSession({ id: "keep" }),
      makeSession({ id: "gone", status: "completed", dismissed_at: "2026-10-30T01:00:00.000Z" }),
    ]);

    const body = await fetchQueue();

    expect(body.items.map((i) => i.id)).toEqual(["keep"]);
    expect(body.counts).toEqual({ waiting: 0, review: 0, running: 1, failed: 0 });
    expect(mocks.getOutput).not.toHaveBeenCalledWith("gone");
  });

  it("uses the last agent message, then the live summary, then the first message", async () => {
    setup(
      [
        makeSession({ id: "chat", status: "completed", first_message: "Fix the bug" }),
        makeSession({ id: "summary-only", first_message: "Add tests" }),
        makeSession({ id: "first-only", first_message: "Write docs" }),
      ],
      { "summary-only": { status: "running", summary: "Halfway there" } },
      {
        chat: [
          { role: "human", content: "Fix the bug" },
          { role: "agent", content: "Looking into it" },
          { role: "agent", content: "Opened a PR with the fix" },
          { role: "human", content: "thanks" },
        ],
        "first-only": new Error("output unavailable"),
      },
    );

    const items = byId(await fetchQueue());

    expect(items.chat.lastAgentMessage).toBe("Opened a PR with the fix");
    expect(items["summary-only"].lastAgentMessage).toBe("Halfway there");
    expect(items["first-only"].lastAgentMessage).toBe("Write docs");
  });

  it("does not poll terminal sessions but still reads their output", async () => {
    setup([
      makeSession({ id: "done", status: "completed" }),
      makeSession({ id: "broke", status: "failed" }),
      makeSession({ id: "busy", status: "running" }),
    ]);

    await fetchQueue();

    expect(mocks.getStatus).toHaveBeenCalledTimes(1);
    expect(mocks.getStatus).toHaveBeenCalledWith("busy");
    expect(mocks.getOutput).toHaveBeenCalledWith("done");
    expect(mocks.getOutput).toHaveBeenCalledWith("broke");
    expect(mocks.getOutput).toHaveBeenCalledWith("busy");
  });

  it("keeps the last-known status when the adapter errors", async () => {
    setup([makeSession({ id: "flaky", status: "needs_review" })], {
      flaky: new Error("vendor down"),
    });

    const body = await fetchQueue();

    expect(body.items[0]).toMatchObject({
      id: "flaky",
      status: "needs_review",
      group: "waiting",
      lastUpdate: "2026-10-30T00:00:03.000Z",
    });
    expect(mocks.patchSession).not.toHaveBeenCalled();
  });

  it("patches the session when the live status changes", async () => {
    setup([makeSession({ id: "s1", status: "running" })], { s1: { status: "completed" } });

    const body = await fetchQueue();

    expect(mocks.patchSession).toHaveBeenCalledWith("s1", {
      status: "completed",
      last_polled: "2026-10-30T00:00:09.000Z",
    });
    expect(body.items[0]).toMatchObject({ status: "completed", group: "review" });
  });

  it("does not patch when the live status is unchanged", async () => {
    setup([makeSession({ id: "s1", status: "running" })]);

    await fetchQueue();

    expect(mocks.patchSession).not.toHaveBeenCalled();
  });

  it("derives repo from the output URL", async () => {
    setup([makeSession({ output_url: "https://github.com/acme/widgets/pull/12" })]);

    const body = await fetchQueue();

    expect(body.items[0].repo).toBe("acme/widgets");
  });

  it("returns an empty queue when listing sessions fails", async () => {
    mocks.listSessions.mockRejectedValue(new Error("not signed in"));

    const body = await fetchQueue();

    expect(body).toEqual({ items: [], counts: { waiting: 0, review: 0, running: 0, failed: 0 } });
  });
});
