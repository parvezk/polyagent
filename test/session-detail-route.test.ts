import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildAdapterMock, getSessionMock, patchSessionMock } = vi.hoisted(() => ({
  buildAdapterMock: vi.fn(),
  getSessionMock: vi.fn(),
  patchSessionMock: vi.fn(),
}));

vi.mock("@/lib/core", () => ({
  buildAdapter: buildAdapterMock,
}));

vi.mock("@/lib/sessions-store", () => ({
  getSession: getSessionMock,
  patchSession: patchSessionMock,
}));

import { GET } from "../web/app/api/sessions/[id]/route.js";

const storedSession = {
  id: "session-123",
  user_id: "user-456",
  vendor: "jules",
  label: "Fix the import flow",
  status: "running",
  output_url: "https://example.test/output",
  first_message: "I am investigating.",
  dispatched_at: "2026-08-01T09:00:00.000Z",
  last_polled: "2026-08-01T09:05:00.000Z",
};

async function getDetail(id = storedSession.id): Promise<Response> {
  return GET(new Request(`https://example.test/api/sessions/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/sessions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 without contacting a vendor when the scoped session is unavailable", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await getDetail("inaccessible-session");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Session not found" });
    expect(getSessionMock).toHaveBeenCalledWith("inaccessible-session");
    expect(buildAdapterMock).not.toHaveBeenCalled();
    expect(patchSessionMock).not.toHaveBeenCalled();
  });

  it("returns live status and normalized output while persisting the poll result", async () => {
    const getStatus = vi.fn().mockResolvedValue({
      status: "needs_review",
      lastUpdate: new Date("2026-08-01T10:15:00.000Z"),
      summary: "Review the proposed patch",
      needsInput: true,
    });
    const getOutput = vi.fn().mockResolvedValue({
      sessionId: storedSession.id,
      vendor: storedSession.vendor,
      messages: [
        {
          role: "human",
          content: "Please fix the import flow.",
          timestamp: new Date("2026-08-01T09:00:00.000Z"),
        },
        {
          role: "agent",
          content: "The patch is ready for review.",
          timestamp: new Date("2026-08-01T10:14:00.000Z"),
        },
      ],
    });
    getSessionMock.mockResolvedValue(storedSession);
    buildAdapterMock.mockReturnValue({ getStatus, getOutput });

    const response = await getDetail();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(buildAdapterMock).toHaveBeenCalledWith("jules");
    expect(getStatus).toHaveBeenCalledWith(storedSession.id);
    expect(getOutput).toHaveBeenCalledWith(storedSession.id);
    expect(patchSessionMock).toHaveBeenCalledWith(storedSession.id, {
      status: "needs_review",
      last_polled: "2026-08-01T10:15:00.000Z",
    });
    expect(body).toMatchObject({
      session: {
        id: storedSession.id,
        vendor: "jules",
        label: storedSession.label,
        status: "needs_review",
        dispatchedAt: storedSession.dispatched_at,
        outputUrl: storedSession.output_url,
      },
      summary: "Review the proposed patch",
      firstMessage: storedSession.first_message,
      messages: [
        {
          role: "human",
          content: "Please fix the import flow.",
          timestamp: "2026-08-01T09:00:00.000Z",
        },
        {
          role: "agent",
          content: "The patch is ready for review.",
          timestamp: "2026-08-01T10:14:00.000Z",
        },
      ],
    });
  });

  it("keeps stored status but still returns output when live status polling fails", async () => {
    const getStatus = vi.fn().mockRejectedValue(new Error("status unavailable"));
    const getOutput = vi.fn().mockResolvedValue({
      sessionId: storedSession.id,
      vendor: storedSession.vendor,
      messages: [
        {
          role: "agent",
          content: "Previously available output",
          timestamp: new Date("2026-08-01T09:04:00.000Z"),
        },
      ],
    });
    getSessionMock.mockResolvedValue(storedSession);
    buildAdapterMock.mockReturnValue({ getStatus, getOutput });

    const response = await getDetail();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.session.status).toBe(storedSession.status);
    expect(body.summary).toBeUndefined();
    expect(body.messages).toEqual([
      {
        role: "agent",
        content: "Previously available output",
        timestamp: "2026-08-01T09:04:00.000Z",
      },
    ]);
    expect(patchSessionMock).not.toHaveBeenCalled();
    expect(getOutput).toHaveBeenCalledWith(storedSession.id);
  });

  it("returns updated status with empty messages when output is unavailable", async () => {
    const getStatus = vi.fn().mockResolvedValue({
      status: "completed",
      lastUpdate: new Date("2026-08-01T11:30:00.000Z"),
      summary: "Import flow fixed",
      needsInput: false,
    });
    const getOutput = vi.fn().mockRejectedValue(new Error("output unavailable"));
    getSessionMock.mockResolvedValue(storedSession);
    buildAdapterMock.mockReturnValue({ getStatus, getOutput });

    const response = await getDetail();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.session.status).toBe("completed");
    expect(body.summary).toBe("Import flow fixed");
    expect(body.messages).toEqual([]);
    expect(patchSessionMock).toHaveBeenCalledWith(storedSession.id, {
      status: "completed",
      last_polled: "2026-08-01T11:30:00.000Z",
    });
  });
});
