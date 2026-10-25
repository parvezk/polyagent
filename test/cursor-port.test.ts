import { afterEach, describe, expect, it, vi } from "vitest";
import { realCursorPort } from "../src/adapters/cursor-port.js";
import { DEFAULT_CURSOR_MODEL } from "../src/constants/cursor.js";

const cursorSdk = vi.hoisted(() => ({
  create: vi.fn(),
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

describe("realCursorPort.createAgent", () => {
  it("omits startingRef when branch is not provided so the repo default is used", async () => {
    cursorSdk.create.mockResolvedValueOnce({
      agentId: "bc-no-branch",
      send: vi.fn().mockResolvedValueOnce({ status: "running" }),
    });

    await realCursorPort("cursor-api-key").createAgent({
      prompt: "Fix billing",
      repo: "acme/legacy",
    });

    expect(cursorSdk.create).toHaveBeenCalledWith({
      apiKey: "cursor-api-key",
      model: { id: DEFAULT_CURSOR_MODEL },
      cloud: {
        autoCreatePR: false,
        repos: [{ url: "https://github.com/acme/legacy" }],
      },
    });
  });

  it("passes an explicit startingRef only when branch is set", async () => {
    cursorSdk.create.mockResolvedValueOnce({
      agentId: "bc-with-branch",
      send: vi.fn().mockResolvedValueOnce({ status: "running" }),
    });

    await realCursorPort("cursor-api-key").createAgent({
      prompt: "Fix billing",
      repo: "acme/legacy",
      branch: "develop",
    });

    expect(cursorSdk.create).toHaveBeenCalledWith({
      apiKey: "cursor-api-key",
      model: { id: DEFAULT_CURSOR_MODEL },
      cloud: {
        autoCreatePR: false,
        repos: [{ url: "https://github.com/acme/legacy", startingRef: "develop" }],
      },
    });
  });

  it("omits repos for no-repo agents instead of building https://github.com/", async () => {
    cursorSdk.create.mockResolvedValueOnce({
      agentId: "bc-no-repo",
      send: vi.fn().mockResolvedValueOnce({ status: "running" }),
    });

    await realCursorPort("cursor-api-key").createAgent({
      prompt: "Brainstorm a plan",
      repo: "",
    });

    expect(cursorSdk.create).toHaveBeenCalledWith({
      apiKey: "cursor-api-key",
      model: { id: DEFAULT_CURSOR_MODEL },
      cloud: { autoCreatePR: false },
    });
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
