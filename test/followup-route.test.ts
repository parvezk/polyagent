import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  buildAdapter: vi.fn(),
  getSession: vi.fn(),
  patchSession: vi.fn(),
  sendFollowup: vi.fn(),
}));

vi.mock("@/lib/core", () => ({
  buildAdapter: mocks.buildAdapter,
}));

vi.mock("@/lib/sessions-store", () => ({
  getSession: mocks.getSession,
  patchSession: mocks.patchSession,
}));

import { POST } from "../web/app/api/sessions/[id]/followup/route";

describe("POST /api/sessions/:id/followup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildAdapter.mockReturnValue({ sendFollowup: mocks.sendFollowup });
  });

  it("marks completed sessions running after accepting a follow-up", async () => {
    mocks.getSession.mockResolvedValue({
      id: "sess_1",
      user_id: "user_1",
      vendor: "claude",
      label: "Done before",
      status: "completed",
      output_url: null,
      first_message: null,
      dispatched_at: "2026-08-10T00:00:00.000Z",
      last_polled: "2026-08-10T00:01:00.000Z",
    });
    mocks.sendFollowup.mockResolvedValue(undefined);

    const response = await POST(
      new Request("https://polyagent.test/api/sessions/sess_1/followup", {
        method: "POST",
        body: JSON.stringify({ message: "Please continue" }),
      }),
      { params: Promise.resolve({ id: "sess_1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.sendFollowup).toHaveBeenCalledWith("sess_1", "Please continue");
    expect(mocks.patchSession).toHaveBeenCalledWith("sess_1", {
      status: "running",
      last_polled: expect.any(String),
    });
  });
});
