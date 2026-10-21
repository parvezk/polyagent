import { afterEach, describe, expect, it, vi } from "vitest";
import { realCursorPort } from "../src/adapters/cursor-port.js";

const cursorSdk = vi.hoisted(() => ({
  get: vi.fn(),
  resume: vi.fn(),
  getRun: vi.fn(),
  listRuns: vi.fn(),
}));

vi.mock("@cursor/sdk", () => ({
  Agent: cursorSdk,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("realCursorPort.sendFollowup", () => {
  it("resumes a live agent handle instead of metadata-only Agent.get", async () => {
    const send = vi.fn().mockResolvedValue({ status: "running" });
    cursorSdk.resume.mockResolvedValueOnce({ send });

    await realCursorPort("cursor-api-key").sendFollowup("agent-123", "Also fix tests");

    expect(cursorSdk.resume).toHaveBeenCalledOnce();
    expect(cursorSdk.resume).toHaveBeenCalledWith("agent-123", {
      apiKey: "cursor-api-key",
    });
    expect(cursorSdk.get).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith("Also fix tests");
  });
});

describe("realCursorPort.getLatestRunStatus", () => {
  it("reads durable agent metadata without using the streaming run APIs", async () => {
    cursorSdk.get.mockResolvedValueOnce({
      status: "finished",
      summary: "Pull request opened",
    });

    const status = await realCursorPort("cursor-api-key").getLatestRunStatus("agent-123");

    expect(status).toEqual({
      status: "finished",
      summary: "Pull request opened",
    });
    expect(cursorSdk.get).toHaveBeenCalledOnce();
    expect(cursorSdk.get).toHaveBeenCalledWith("agent-123", {
      apiKey: "cursor-api-key",
    });
    expect(cursorSdk.listRuns).not.toHaveBeenCalled();
    expect(cursorSdk.getRun).not.toHaveBeenCalled();
  });

  it("defaults a missing SDK status to running", async () => {
    cursorSdk.get.mockResolvedValueOnce({
      summary: "Agent metadata is still initializing",
    });

    await expect(realCursorPort("cursor-api-key").getLatestRunStatus("agent-456")).resolves.toEqual(
      {
        status: "running",
        summary: "Agent metadata is still initializing",
      },
    );
  });
});
