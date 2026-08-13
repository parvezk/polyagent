import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentSession } from "../src/types.js";

const mocks = vi.hoisted(() => ({
  buildAdapter: vi.fn(),
  getStatus: vi.fn(),
  sessions: [] as AgentSession[],
  load: vi.fn(),
  upsert: vi.fn(),
  upsertMany: vi.fn(),
}));

vi.mock("../src/config.js", () => ({
  STATE_PATH: "/tmp/polyagent-test-state.json",
}));

vi.mock("../src/registry.js", () => ({
  buildAdapter: mocks.buildAdapter,
}));

vi.mock("../src/state.js", () => ({
  StateStore: vi.fn().mockImplementation(() => ({
    load: mocks.load,
    list: () => mocks.sessions,
    upsert: mocks.upsert,
    upsertMany: mocks.upsertMany,
  })),
}));

import { statusCommand } from "../src/commands/status.js";

describe("statusCommand terminal polling", () => {
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    mocks.sessions = [
      {
        id: "completed-1",
        vendor: "claude",
        status: "completed",
        dispatchedAt: "2026-06-23T00:00:00.000Z",
        lastPolled: "2026-06-23T00:01:00.000Z",
      },
      {
        id: "failed-1",
        vendor: "jules",
        status: "failed",
        dispatchedAt: "2026-06-23T00:00:00.000Z",
        lastPolled: "2026-06-23T00:02:00.000Z",
      },
    ];
    mocks.buildAdapter.mockReturnValue({ getStatus: mocks.getStatus });
  });

  afterEach(() => {
    consoleLog.mockRestore();
  });

  it("does not poll adapters or upsert state for terminal sessions", async () => {
    await statusCommand();

    expect(mocks.load).toHaveBeenCalled();
    expect(mocks.buildAdapter).not.toHaveBeenCalled();
    expect(mocks.getStatus).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.upsertMany).not.toHaveBeenCalled();
  });
});
