import { beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => ({
  buildAdapter: vi.fn(),
  getSession: vi.fn(),
  sendFollowup: vi.fn(),
}));

vi.mock("@/lib/core", () => ({
  buildAdapter: fakes.buildAdapter,
}));

vi.mock("@/lib/sessions-store", () => ({
  getSession: fakes.getSession,
}));

import { POST } from "../web/app/api/sessions/[id]/followup/route.js";

const session = {
  id: "session-1",
  user_id: "user-123",
  vendor: "gemini" as const,
  label: null,
  status: "running",
  output_url: null,
  first_message: null,
  dispatched_at: "2026-07-28T10:00:00.000Z",
  last_polled: null,
};

function rawRequest(body: string): Request {
  return new Request("http://localhost/api/sessions/session-1/followup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

function jsonRequest(body: unknown): Request {
  return rawRequest(JSON.stringify(body));
}

function context(id = "session-1") {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/sessions/[id]/followup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fakes.getSession.mockResolvedValue(session);
    fakes.buildAdapter.mockReturnValue({ sendFollowup: fakes.sendFollowup });
  });

  it("rejects malformed JSON before looking up a session", async () => {
    const response = await POST(rawRequest("{"), context());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "message is required" });
    expect(fakes.getSession).not.toHaveBeenCalled();
    expect(fakes.buildAdapter).not.toHaveBeenCalled();
  });

  it.each([undefined, "", "   ", "\n\t"])(
    "rejects a blank message before looking up a session",
    async (message) => {
      const response = await POST(jsonRequest({ message }), context());

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "message is required" });
      expect(fakes.getSession).not.toHaveBeenCalled();
      expect(fakes.buildAdapter).not.toHaveBeenCalled();
    },
  );

  it("returns not found without constructing an adapter for an inaccessible session", async () => {
    fakes.getSession.mockResolvedValue(null);

    const response = await POST(jsonRequest({ message: "Continue" }), context("missing-session"));

    expect(fakes.getSession).toHaveBeenCalledWith("missing-session");
    expect(fakes.buildAdapter).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Session not found" });
  });

  it("routes the exact message to the persisted session vendor", async () => {
    const message = "  Keep the existing formatting.\n";

    const response = await POST(jsonRequest({ message }), context());

    expect(fakes.getSession).toHaveBeenCalledWith("session-1");
    expect(fakes.buildAdapter).toHaveBeenCalledWith("gemini");
    expect(fakes.sendFollowup).toHaveBeenCalledWith("session-1", message);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("reports a vendor failure without returning success", async () => {
    fakes.sendFollowup.mockRejectedValue(new Error("Vendor unavailable"));

    const response = await POST(jsonRequest({ message: "Continue" }), context());

    expect(fakes.sendFollowup).toHaveBeenCalledWith("session-1", "Continue");
    expect(response.status).toBe(502);
  });
});
