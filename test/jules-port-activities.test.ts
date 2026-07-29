import { afterEach, describe, expect, it, vi } from "vitest";
import { realJulesPort } from "../src/adapters/jules-port.js";
import { JULES_API_BASE } from "../src/constants/jules.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("realJulesPort listActivities", () => {
  it("normalizes heterogeneous Jules activities into agent and human messages", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json({
        activities: [
          {
            role: "AGENT",
            content: "Plan ready",
            timestamp: "2026-07-01T10:00:00.000Z",
          },
          {
            author: "USER",
            message: "Approve plan",
            createTime: "2026-07-01T10:01:00.000Z",
          },
          {
            role: "human",
            content: "Ship it",
            timestamp: "2026-07-01T10:02:00.000Z",
          },
          {
            role: "agent",
            message: "Opening PR",
            createTime: "2026-07-01T10:03:00.000Z",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await realJulesPort("test-api-key").listActivities("session-123");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      `${JULES_API_BASE}/sessions/session-123/activities`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": "test-api-key",
          "Content-Type": "application/json",
        },
      },
    );
    expect(result).toEqual({
      messages: [
        {
          role: "agent",
          content: "Plan ready",
          timestamp: "2026-07-01T10:00:00.000Z",
        },
        {
          role: "human",
          content: "Approve plan",
          timestamp: "2026-07-01T10:01:00.000Z",
        },
        {
          role: "human",
          content: "Ship it",
          timestamp: "2026-07-01T10:02:00.000Z",
        },
        {
          role: "agent",
          content: "Opening PR",
          timestamp: "2026-07-01T10:03:00.000Z",
        },
      ],
    });
  });
});
