import { describe, it, expect, vi } from "vitest";
import type { ClaudePort } from "../src/adapters/claude-port.js";
import { ClaudeAdapter } from "../src/adapters/claude.js";

// ---------------------------------------------------------------------------
// Fake port factory
// ---------------------------------------------------------------------------

function fakePort(over?: Partial<ClaudePort>): ClaudePort {
  return {
    createSession: vi.fn().mockResolvedValue({
      sessionId: "sess_1",
      firstReply: "On it.",
      status: "running" as const,
    }),
    getStatus: vi.fn().mockResolvedValue({ status: "running" as const }),
    sendEvent: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

// ---------------------------------------------------------------------------
// dispatch
// ---------------------------------------------------------------------------

describe("ClaudeAdapter.dispatch", () => {
  it("returns a normalized AgentSession with vendor=claude and id from port", async () => {
    const port = fakePort();
    const adapter = new ClaudeAdapter(port);

    const session = await adapter.dispatch({ prompt: "Write a hello world\nMore details here" });

    expect(session.vendor).toBe("claude");
    expect(session.id).toBe("sess_1");
    expect(session.status).toBe("running");
  });

  it("sets label to the first line of the prompt truncated to 80 chars", async () => {
    const port = fakePort();
    const adapter = new ClaudeAdapter(port);
    const prompt = "First line of the prompt\nSecond line";
    const session = await adapter.dispatch({ prompt });

    expect(session.label).toBe("First line of the prompt");
  });

  it("passes modelId through to port.createSession", async () => {
    const port = fakePort();
    const adapter = new ClaudeAdapter(port);

    await adapter.dispatch({ prompt: "Do something", model: "claude-opus-4-8" });

    expect(port.createSession).toHaveBeenCalledWith({
      prompt: "Do something",
      modelId: "claude-opus-4-8",
    });
  });

  it("dispatchedAt is an ISO string", async () => {
    const port = fakePort();
    const adapter = new ClaudeAdapter(port);
    const session = await adapter.dispatch({ prompt: "test" });

    expect(new Date(session.dispatchedAt).toISOString()).toBe(session.dispatchedAt);
  });
});

// ---------------------------------------------------------------------------
// getStatus — status mapping
// ---------------------------------------------------------------------------

describe("ClaudeAdapter.getStatus — status mapping", () => {
  it('maps "running" -> "running"', async () => {
    const port = fakePort({ getStatus: vi.fn().mockResolvedValue({ status: "running" }) });
    const result = await new ClaudeAdapter(port).getStatus("sess_1");
    expect(result.status).toBe("running");
  });

  it('maps "rescheduling" -> "running"', async () => {
    const port = fakePort({ getStatus: vi.fn().mockResolvedValue({ status: "rescheduling" }) });
    const result = await new ClaudeAdapter(port).getStatus("sess_1");
    expect(result.status).toBe("running");
  });

  it('maps "idle" -> "needs_review" and sets needsInput=true', async () => {
    const port = fakePort({ getStatus: vi.fn().mockResolvedValue({ status: "idle" }) });
    const result = await new ClaudeAdapter(port).getStatus("sess_1");
    expect(result.status).toBe("needs_review");
    expect(result.needsInput).toBe(true);
  });

  it('maps "terminated" -> "completed"', async () => {
    const port = fakePort({ getStatus: vi.fn().mockResolvedValue({ status: "terminated" }) });
    const result = await new ClaudeAdapter(port).getStatus("sess_1");
    expect(result.status).toBe("completed");
  });

  it('maps unknown status strings -> "unknown"', async () => {
    const port = fakePort({
      getStatus: vi.fn().mockResolvedValue({ status: "some_future_status" }),
    });
    const result = await new ClaudeAdapter(port).getStatus("sess_1");
    expect(result.status).toBe("unknown");
  });

  it("returns status=unknown (does NOT throw) when port.getStatus throws", async () => {
    const port = fakePort({
      getStatus: vi.fn().mockRejectedValue(new Error("API error")),
    });
    const adapter = new ClaudeAdapter(port);

    // Must not throw
    const result = await adapter.getStatus("sess_1");
    expect(result.status).toBe("unknown");
    expect(result.needsInput).toBe(false);
    expect(result.lastUpdate).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// getOutput
// ---------------------------------------------------------------------------

describe("ClaudeAdapter.getOutput", () => {
  it("returns an AgentOutput with one message when summary is present", async () => {
    const port = fakePort({
      getStatus: vi.fn().mockResolvedValue({ status: "idle", summary: "Done!" }),
    });
    const output = await new ClaudeAdapter(port).getOutput("sess_1");
    expect(output.sessionId).toBe("sess_1");
    expect(output.vendor).toBe("claude");
    expect(output.messages).toHaveLength(1);
    expect(output.messages[0].role).toBe("agent");
    expect(output.messages[0].content).toBe("Done!");
  });

  it("returns empty messages when no summary", async () => {
    const port = fakePort({
      getStatus: vi.fn().mockResolvedValue({ status: "running" }),
    });
    const output = await new ClaudeAdapter(port).getOutput("sess_1");
    expect(output.messages).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// sendFollowup
// ---------------------------------------------------------------------------

describe("ClaudeAdapter.sendFollowup", () => {
  it("delegates to port.sendEvent", async () => {
    const port = fakePort();
    await new ClaudeAdapter(port).sendFollowup("sess_1", "hello");
    expect(port.sendEvent).toHaveBeenCalledWith("sess_1", "hello");
  });
});
