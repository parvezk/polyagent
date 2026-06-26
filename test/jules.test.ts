import { describe, it, expect } from "vitest";
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
