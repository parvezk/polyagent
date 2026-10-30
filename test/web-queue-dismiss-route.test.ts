import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUserId: vi.fn(),
  getSession: vi.fn(),
  dismissSession: vi.fn(),
}));

vi.mock("@/lib/sessions-store", () => ({
  currentUserId: mocks.currentUserId,
  getSession: mocks.getSession,
  dismissSession: mocks.dismissSession,
}));

const { POST } = await import("../web/app/api/queue/[id]/dismiss/route");

function call(id = "s1") {
  return POST(new Request(`http://localhost/api/queue/${id}/dismiss`, { method: "POST" }), {
    params: Promise.resolve({ id }),
  });
}

describe("POST /api/queue/:id/dismiss", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUserId.mockResolvedValue("user-1");
    mocks.getSession.mockResolvedValue({ id: "s1", vendor: "claude", status: "completed" });
    mocks.dismissSession.mockResolvedValue(undefined);
  });

  it("returns 401 when not signed in", async () => {
    mocks.currentUserId.mockResolvedValue(null);

    const res = await call();

    expect(res.status).toBe(401);
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.dismissSession).not.toHaveBeenCalled();
  });

  it("returns 404 when the session does not exist", async () => {
    mocks.getSession.mockResolvedValue(null);

    const res = await call("missing");

    expect(res.status).toBe(404);
    expect(mocks.dismissSession).not.toHaveBeenCalled();
  });

  it("dismisses the session", async () => {
    const res = await call("s1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.dismissSession).toHaveBeenCalledWith("s1");
  });

  it("returns 500 with the error message when the store fails", async () => {
    mocks.dismissSession.mockRejectedValue(
      new Error('column "dismissed_at" of relation "sessions" does not exist'),
    );

    const res = await call();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: 'column "dismissed_at" of relation "sessions" does not exist',
    });
  });
});
