import { describe, it, expect } from "vitest";
import { CursorAdapter } from "../src/adapters/cursor.js";
import type { CursorPort, CursorRunStatus } from "../src/adapters/cursor-port.js";

function fakePort(over?: Partial<CursorPort>): CursorPort {
  return {
    createAgent: async (_i) => ({ agentId: "bc-cursor-1", status: "running" as CursorRunStatus }),
    getLatestRunStatus: async (_id) => ({ status: "running" as CursorRunStatus }),
    sendFollowup: async (_id, _msg) => undefined,
    ...over,
  };
}

describe("CursorAdapter", () => {
  it("dispatch returns normalized session with vendor 'cursor', id from agentId, status 'running', label from prompt", async () => {
    const adapter = new CursorAdapter(fakePort());
    const session = await adapter.dispatch({
      prompt: "Fix the bug\nMore details here",
      repo: "owner/repo",
    });

    expect(session.vendor).toBe("cursor");
    expect(session.id).toBe("bc-cursor-1");
    expect(session.status).toBe("running");
    expect(session.label).toBe("Fix the bug");
  });

  it("getStatus maps 'finished' to 'completed'", async () => {
    const adapter = new CursorAdapter(
      fakePort({ getLatestRunStatus: async (_id) => ({ status: "finished" as CursorRunStatus }) }),
    );
    const status = await adapter.getStatus("bc-cursor-1");

    expect(status.status).toBe("completed");
    expect(status.needsInput).toBe(false);
  });

  it("getStatus maps 'error' to 'failed'", async () => {
    const adapter = new CursorAdapter(
      fakePort({ getLatestRunStatus: async (_id) => ({ status: "error" as CursorRunStatus }) }),
    );
    const status = await adapter.getStatus("bc-cursor-1");

    expect(status.status).toBe("failed");
    expect(status.needsInput).toBe(false);
  });

  it("getStatus returns 'unknown' (does NOT throw) when port.getLatestRunStatus throws", async () => {
    const adapter = new CursorAdapter(
      fakePort({
        getLatestRunStatus: async (_id) => {
          throw new Error("network error");
        },
      }),
    );
    const status = await adapter.getStatus("bc-cursor-1");

    expect(status.status).toBe("unknown");
    expect(status.needsInput).toBe(false);
  });
});
