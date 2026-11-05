import { afterEach, describe, expect, it, vi } from "vitest";
import { realCursorPort } from "../src/adapters/cursor-port.js";

const cursorSdk = vi.hoisted(() => ({
  get: vi.fn(),
  getRun: vi.fn(),
  listRuns: vi.fn(),
}));

vi.mock("@cursor/sdk", () => ({
  Agent: cursorSdk,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("realCursorPort.getLatestRunStatus", () => {
  it("reads the latest cloud run status without Agent.get or streaming getRun", async () => {
    cursorSdk.listRuns.mockResolvedValueOnce({
      items: [{ status: "finished", result: "Pull request opened" }],
    });

    const status = await realCursorPort("cursor-api-key").getLatestRunStatus("bc-agent-123");

    expect(status).toEqual({
      status: "finished",
      summary: "Pull request opened",
    });
    expect(cursorSdk.listRuns).toHaveBeenCalledOnce();
    expect(cursorSdk.listRuns).toHaveBeenCalledWith("bc-agent-123", {
      runtime: "cloud",
      apiKey: "cursor-api-key",
      limit: 1,
    });
    expect(cursorSdk.get).not.toHaveBeenCalled();
    expect(cursorSdk.getRun).not.toHaveBeenCalled();
  });

  it("defaults to running when no runs exist yet", async () => {
    cursorSdk.listRuns.mockResolvedValueOnce({ items: [] });

    await expect(
      realCursorPort("cursor-api-key").getLatestRunStatus("bc-agent-456"),
    ).resolves.toEqual({
      status: "running",
      summary: undefined,
    });
  });

  it("does not treat Agent.get-style name metadata as a finished run", async () => {
    // Regression: cloud Agent.get mapper omits status and sets summary=name.
    // Pollers must not keep finished agents stuck on running forever.
    cursorSdk.listRuns.mockResolvedValueOnce({
      items: [{ status: "finished", result: "Done" }],
    });

    const status = await realCursorPort("key").getLatestRunStatus("bc-done");

    expect(status.status).toBe("finished");
    expect(status.summary).toBe("Done");
  });
});
