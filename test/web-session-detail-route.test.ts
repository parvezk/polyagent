import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildAdapter: vi.fn(),
  getOutput: vi.fn(),
  getSession: vi.fn(),
  getStatus: vi.fn(),
  patchSession: vi.fn(),
}));

vi.mock("@/lib/core", () => ({
  buildAdapter: mocks.buildAdapter,
}));

vi.mock("@/lib/sessions-store", () => ({
  getSession: mocks.getSession,
  patchSession: mocks.patchSession,
}));

import { GET } from "../web/app/api/sessions/[id]/route";

describe("GET /api/sessions/:id polling optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildAdapter.mockReturnValue({
      getOutput: mocks.getOutput,
      getStatus: mocks.getStatus,
    });
    mocks.getOutput.mockResolvedValue({ messages: [] });
  });

  it("does not patch the session when live status and timestamp are unchanged", async () => {
    const lastPolled = "2026-06-23T00:01:00.000Z";
    mocks.getSession.mockResolvedValue({
      id: "sess_1",
      vendor: "claude",
      label: null,
      status: "running",
      dispatched_at: "2026-06-23T00:00:00.000Z",
      last_polled: lastPolled,
      output_url: null,
      first_message: null,
    });
    mocks.getStatus.mockResolvedValue({
      status: "running",
      lastUpdate: new Date(lastPolled),
      summary: "Still running",
    });

    await GET(new Request("http://localhost/api/sessions/sess_1"), {
      params: Promise.resolve({ id: "sess_1" }),
    });

    expect(mocks.patchSession).not.toHaveBeenCalled();
  });
});
