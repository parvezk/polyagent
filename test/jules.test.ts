import { describe, it, expect, vi } from "vitest";
import { JulesAdapter } from "../src/adapters/jules.js";
import type { JulesPort, JulesState } from "../src/adapters/jules-port.js";

function fakePort(over?: Partial<JulesPort>): JulesPort {
  return {
    createSession: async (_i) => ({ sessionId: "jules_1", state: "IN_PROGRESS" as JulesState }),
    getSession: async (_id) => ({ state: "IN_PROGRESS" as JulesState }),
    listActivities: async (_id) => ({ messages: [] }),
    sendMessage: async (_id, _msg) => undefined,
    ...over,
  };
}

describe("JulesAdapter", () => {
  it("dispatch returns normalized session with vendor 'jules', id from port, status 'running', label from prompt", async () => {
    const adapter = new JulesAdapter(fakePort());
    const session = await adapter.dispatch({ prompt: "Fix the bug\nMore details here" });

    expect(session.vendor).toBe("jules");
    expect(session.id).toBe("jules_1");
    expect(session.status).toBe("running");
    expect(session.label).toBe("Fix the bug");
  });

  it("getStatus maps AWAITING_USER_FEEDBACK to needs_review with needsInput true", async () => {
    const adapter = new JulesAdapter(
      fakePort({ getSession: async (_id) => ({ state: "AWAITING_USER_FEEDBACK" as JulesState }) }),
    );
    const status = await adapter.getStatus("jules_1");

    expect(status.status).toBe("needs_review");
    expect(status.needsInput).toBe(true);
  });

  it("getStatus maps COMPLETED to completed", async () => {
    const adapter = new JulesAdapter(
      fakePort({ getSession: async (_id) => ({ state: "COMPLETED" as JulesState }) }),
    );
    const status = await adapter.getStatus("jules_1");

    expect(status.status).toBe("completed");
    expect(status.needsInput).toBe(false);
  });

  it("getStatus maps FAILED to failed", async () => {
    const adapter = new JulesAdapter(
      fakePort({ getSession: async (_id) => ({ state: "FAILED" as JulesState }) }),
    );
    const status = await adapter.getStatus("jules_1");

    expect(status.status).toBe("failed");
    expect(status.needsInput).toBe(false);
  });

  it("getStatus returns unknown (does NOT throw) when port.getSession throws", async () => {
    const adapter = new JulesAdapter(
      fakePort({
        getSession: async (_id) => {
          throw new Error("network error");
        },
      }),
    );
    const status = await adapter.getStatus("jules_1");

    expect(status.status).toBe("unknown");
    expect(status.needsInput).toBe(false);
  });
});

describe("JulesAdapter.getOutput", () => {
  it("requests the session activities and preserves messages with normalized timestamps", async () => {
    const listActivities = vi.fn().mockResolvedValue({
      messages: [
        {
          role: "human" as const,
          content: "Please add an edge-case test.",
          timestamp: "2026-08-06T09:15:00.000Z",
        },
        {
          role: "agent" as const,
          content: "The regression test is passing.",
          timestamp: "2026-08-06T09:16:30.000Z",
        },
      ],
    });
    const adapter = new JulesAdapter(fakePort({ listActivities }));

    const output = await adapter.getOutput("jules_output_1");

    expect(listActivities).toHaveBeenCalledOnce();
    expect(listActivities).toHaveBeenCalledWith("jules_output_1");
    expect(output).toEqual({
      sessionId: "jules_output_1",
      vendor: "jules",
      messages: [
        {
          role: "human",
          content: "Please add an edge-case test.",
          timestamp: new Date("2026-08-06T09:15:00.000Z"),
        },
        {
          role: "agent",
          content: "The regression test is passing.",
          timestamp: new Date("2026-08-06T09:16:30.000Z"),
        },
      ],
    });
  });
});
