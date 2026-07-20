import { beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => ({
  buildAdapter: vi.fn(),
  currentUserId: vi.fn(),
  dispatch: vi.fn(),
  toDbRow: vi.fn(),
  upsertSession: vi.fn(),
}));

vi.mock("@/lib/core", () => ({
  buildAdapter: fakes.buildAdapter,
}));

vi.mock("@/lib/sessions-store", () => ({
  currentUserId: fakes.currentUserId,
  toDbRow: fakes.toDbRow,
  upsertSession: fakes.upsertSession,
}));

import { POST } from "../web/app/api/dispatch/route.js";

function rawRequest(body: string): Request {
  return new Request("http://localhost/api/dispatch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

function jsonRequest(body: unknown): Request {
  return rawRequest(JSON.stringify(body));
}

describe("POST /api/dispatch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fakes.currentUserId.mockResolvedValue("user-123");
    fakes.buildAdapter.mockReturnValue({ dispatch: fakes.dispatch });
  });

  it("rejects unauthenticated requests before dispatching", async () => {
    fakes.currentUserId.mockResolvedValue(null);

    const response = await POST(jsonRequest({ vendor: "claude", prompt: "Fix auth" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Not authenticated" });
    expect(fakes.buildAdapter).not.toHaveBeenCalled();
    expect(fakes.upsertSession).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON before dispatching", async () => {
    const response = await POST(rawRequest("{"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON body" });
    expect(fakes.buildAdapter).not.toHaveBeenCalled();
  });

  it.each([
    ["vendor", { prompt: "Fix auth" }],
    ["prompt", { vendor: "claude" }],
  ])("requires %s before dispatching", async (_field, body) => {
    const response = await POST(jsonRequest(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "vendor and prompt are required",
    });
    expect(fakes.buildAdapter).not.toHaveBeenCalled();
  });

  it("requires a repository for Jules", async () => {
    const response = await POST(jsonRequest({ vendor: "jules", prompt: "Fix auth" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Jules requires a repo (owner/repo)",
    });
    expect(fakes.buildAdapter).not.toHaveBeenCalled();
  });

  it("dispatches the request and persists the user-scoped session", async () => {
    const session = {
      id: "session-1",
      vendor: "claude",
      status: "running",
      dispatchedAt: "2026-07-20T10:00:00.000Z",
    };
    const row = { id: session.id, user_id: "user-123" };
    fakes.dispatch.mockResolvedValue(session);
    fakes.toDbRow.mockReturnValue(row);

    const response = await POST(
      jsonRequest({
        vendor: "claude",
        prompt: "Fix auth",
        repo: "acme/app",
        model: "claude-sonnet-4-20250514",
      }),
    );

    expect(fakes.buildAdapter).toHaveBeenCalledWith("claude");
    expect(fakes.dispatch).toHaveBeenCalledWith({
      prompt: "Fix auth",
      repo: "acme/app",
      model: "claude-sonnet-4-20250514",
    });
    expect(fakes.toDbRow).toHaveBeenCalledWith(session, "user-123");
    expect(fakes.upsertSession).toHaveBeenCalledWith(row);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ session });
  });

  it("returns the adapter error without attempting persistence", async () => {
    fakes.dispatch.mockRejectedValue(new Error("Vendor unavailable"));

    const response = await POST(jsonRequest({ vendor: "claude", prompt: "Fix auth" }));

    expect(response.status).toBe(502);
    expect(fakes.toDbRow).not.toHaveBeenCalled();
    expect(fakes.upsertSession).not.toHaveBeenCalled();
  });

  it("returns a persistence error instead of reporting an untracked session", async () => {
    const session = {
      id: "session-1",
      vendor: "claude",
      status: "running",
      dispatchedAt: "2026-07-20T10:00:00.000Z",
    };
    fakes.dispatch.mockResolvedValue(session);
    fakes.toDbRow.mockReturnValue({ id: session.id, user_id: "user-123" });
    fakes.upsertSession.mockRejectedValue(new Error("Database unavailable"));

    const response = await POST(jsonRequest({ vendor: "claude", prompt: "Fix auth" }));

    expect(response.status).toBe(502);
  });
});
