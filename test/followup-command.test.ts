import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentSession } from "../src/types.js";

const mocks = vi.hoisted(() => ({
  buildAdapter: vi.fn(),
  sendFollowup: vi.fn(),
  get: vi.fn(),
  upsert: vi.fn(),
  session: null as AgentSession | null,
}));

vi.mock("../src/config.js", () => ({
  STATE_PATH: "/tmp/polyagent-followup-test-state.json",
}));

vi.mock("../src/registry.js", () => ({
  buildAdapter: mocks.buildAdapter,
}));

vi.mock("../src/state.js", () => ({
  StateStore: vi.fn().mockImplementation(() => ({
    get: (id: string) => (mocks.session?.id === id ? mocks.session : undefined),
    upsert: mocks.upsert,
  })),
}));

import { followupCommand } from "../src/commands/followup.js";

describe("followupCommand", () => {
  let consoleLog: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.session = {
      id: "sess-1",
      vendor: "claude",
      status: "completed",
      dispatchedAt: "2026-06-23T00:00:00.000Z",
      lastPolled: "2026-06-23T00:01:00.000Z",
    };
    mocks.sendFollowup.mockResolvedValue(undefined);
    mocks.buildAdapter.mockReturnValue({ sendFollowup: mocks.sendFollowup });
  });

  afterEach(() => {
    consoleLog.mockRestore();
    consoleError.mockRestore();
    process.exitCode = undefined;
  });

  it("marks a terminal session running after a successful follow-up", async () => {
    await followupCommand("sess-1", "continue please");

    expect(mocks.sendFollowup).toHaveBeenCalledWith("sess-1", "continue please");
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    const saved = mocks.upsert.mock.calls[0][0] as AgentSession;
    expect(saved.id).toBe("sess-1");
    expect(saved.status).toBe("running");
    expect(saved.lastPolled).toEqual(expect.any(String));
    expect(process.exitCode).toBeUndefined();
  });

  it("does not upsert when the vendor follow-up fails", async () => {
    mocks.sendFollowup.mockRejectedValue(new Error("vendor down"));

    await followupCommand("sess-1", "continue please");

    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("errors when the session id is unknown", async () => {
    mocks.session = null;

    await followupCommand("missing", "hi");

    expect(mocks.buildAdapter).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
