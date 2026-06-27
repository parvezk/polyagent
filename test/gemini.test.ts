import { describe, it, expect } from "vitest";
import { GeminiAdapter } from "../src/adapters/gemini.js";
import type { GeminiPort, GeminiInteractionStatus } from "../src/adapters/gemini-port.js";

function fakePort(over?: Partial<GeminiPort>): GeminiPort {
  return {
    createInteraction: async (_i) => ({
      interactionId: "gemini_1",
      status: "in_progress" as GeminiInteractionStatus,
    }),
    getStatus: async (_id) => ({ status: "in_progress" as GeminiInteractionStatus }),
    sendFollowup: async (_id, _msg) => undefined,
    ...over,
  };
}

describe("GeminiAdapter", () => {
  it("dispatch returns normalized session with vendor 'gemini', id from interactionId, status 'running' for in_progress, label from prompt", async () => {
    const adapter = new GeminiAdapter(fakePort());
    const session = await adapter.dispatch({ prompt: "Fix the bug\nMore details here" });

    expect(session.vendor).toBe("gemini");
    expect(session.id).toBe("gemini_1");
    expect(session.status).toBe("running");
    expect(session.label).toBe("Fix the bug");
  });

  it("getStatus maps completed to completed", async () => {
    const adapter = new GeminiAdapter(
      fakePort({
        getStatus: async (_id) => ({ status: "completed" as GeminiInteractionStatus }),
      }),
    );
    const status = await adapter.getStatus("gemini_1");

    expect(status.status).toBe("completed");
    expect(status.needsInput).toBe(false);
  });

  it("getStatus maps failed to failed", async () => {
    const adapter = new GeminiAdapter(
      fakePort({
        getStatus: async (_id) => ({ status: "failed" as GeminiInteractionStatus }),
      }),
    );
    const status = await adapter.getStatus("gemini_1");

    expect(status.status).toBe("failed");
    expect(status.needsInput).toBe(false);
  });

  it("getStatus maps cancelled to failed", async () => {
    const adapter = new GeminiAdapter(
      fakePort({
        getStatus: async (_id) => ({ status: "cancelled" as GeminiInteractionStatus }),
      }),
    );
    const status = await adapter.getStatus("gemini_1");

    expect(status.status).toBe("failed");
    expect(status.needsInput).toBe(false);
  });

  it("getStatus returns unknown (does NOT throw) when port.getStatus throws", async () => {
    const adapter = new GeminiAdapter(
      fakePort({
        getStatus: async (_id) => {
          throw new Error("network error");
        },
      }),
    );
    const status = await adapter.getStatus("gemini_1");

    expect(status.status).toBe("unknown");
    expect(status.needsInput).toBe(false);
  });
});
