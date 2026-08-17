import { afterEach, describe, expect, it, vi } from "vitest";
import { realJulesPort } from "../src/adapters/jules-port.js";
import { JULES_API_BASE } from "../src/constants/jules.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("realJulesPort listActivities", () => {
  it("maps Jules Activity union fields (agentMessaged / userMessaged / …) into messages", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json({
        activities: [
          {
            originator: "system",
            description: "Session started",
            createTime: "2026-07-01T09:59:00.000Z",
          },
          {
            originator: "agent",
            createTime: "2026-07-01T10:00:00.000Z",
            planGenerated: {
              plan: {
                steps: [
                  { title: "Inspect auth", description: "Review module" },
                  { title: "Add tests" },
                ],
              },
            },
          },
          {
            originator: "user",
            createTime: "2026-07-01T10:01:00.000Z",
            userMessaged: { userMessage: "Approve plan" },
          },
          {
            originator: "agent",
            createTime: "2026-07-01T10:02:00.000Z",
            progressUpdated: { title: "Coding", description: "Writing tests" },
          },
          {
            originator: "agent",
            createTime: "2026-07-01T10:03:00.000Z",
            agentMessaged: { agentMessage: "Opening PR" },
          },
          {
            originator: "agent",
            createTime: "2026-07-01T10:04:00.000Z",
            sessionFailed: { reason: "Quota exceeded" },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await realJulesPort("test-api-key").listActivities("session-123");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      `${JULES_API_BASE}/sessions/session-123/activities?pageSize=100`,
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
          content: "Plan:\n1. Inspect auth — Review module\n2. Add tests",
          timestamp: "2026-07-01T10:00:00.000Z",
        },
        {
          role: "human",
          content: "Approve plan",
          timestamp: "2026-07-01T10:01:00.000Z",
        },
        {
          role: "agent",
          content: "Coding: Writing tests",
          timestamp: "2026-07-01T10:02:00.000Z",
        },
        {
          role: "agent",
          content: "Opening PR",
          timestamp: "2026-07-01T10:03:00.000Z",
        },
        {
          role: "agent",
          content: "Quota exceeded",
          timestamp: "2026-07-01T10:04:00.000Z",
        },
      ],
    });
  });

  it("paginates until nextPageToken is exhausted", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          activities: [
            {
              originator: "agent",
              createTime: "2026-07-01T10:00:00.000Z",
              agentMessaged: { agentMessage: "page-1" },
            },
          ],
          nextPageToken: "tok-2",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          activities: [
            {
              originator: "user",
              createTime: "2026-07-01T10:01:00.000Z",
              userMessaged: { userMessage: "page-2" },
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await realJulesPort("test-api-key").listActivities("session-123");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${JULES_API_BASE}/sessions/session-123/activities?pageSize=100`,
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      `${JULES_API_BASE}/sessions/session-123/activities?pageSize=100&pageToken=tok-2`,
    );
    expect(result.messages.map((m) => m.content)).toEqual(["page-1", "page-2"]);
  });
});
