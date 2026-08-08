import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { realClaudePort } from "../src/adapters/claude-port.js";
import {
  CLAUDE_AGENT_TOOLSET,
  DEFAULT_AGENT_SYSTEM_PROMPT,
  DEFAULT_CLAUDE_MODEL,
} from "../src/constants/claude.js";

const anthropicSdk = vi.hoisted(() => ({
  construct: vi.fn(),
  createAgent: vi.fn(),
  createEnvironment: vi.fn(),
  createSession: vi.fn(),
  retrieveSession: vi.fn(),
  streamEvents: vi.fn(),
  sendEvents: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class Anthropic {
    beta = {
      agents: { create: anthropicSdk.createAgent },
      environments: { create: anthropicSdk.createEnvironment },
      sessions: {
        create: anthropicSdk.createSession,
        retrieve: anthropicSdk.retrieveSession,
        events: {
          stream: anthropicSdk.streamEvents,
          send: anthropicSdk.sendEvents,
        },
      },
    };

    constructor(options: unknown) {
      anthropicSdk.construct(options);
    }
  },
}));

function eventStream(events: unknown[]): AsyncIterable<unknown> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const event of events) yield event;
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  anthropicSdk.createAgent.mockResolvedValue({ id: "agent-123" });
  anthropicSdk.createEnvironment.mockResolvedValue({ id: "environment-456" });
  anthropicSdk.createSession.mockResolvedValue({ id: "session-789" });
  anthropicSdk.sendEvents.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("realClaudePort", () => {
  it("binds the created resources, subscribes before sending, and returns the first text reply", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_786_163_400_000);
    anthropicSdk.streamEvents.mockResolvedValue(
      eventStream([
        { type: "session.started" },
        {
          type: "agent.message",
          content: [
            { type: "text", text: "Ready " },
            { type: "tool_use", name: "bash" },
            { type: "text", text: "to help." },
          ],
        },
      ]),
    );

    const result = await realClaudePort("test-api-key").createSession({
      prompt: "Fix the billing webhook\nInclude regression tests",
    });

    expect(anthropicSdk.construct).toHaveBeenCalledWith({ apiKey: "test-api-key" });
    expect(anthropicSdk.createAgent).toHaveBeenCalledWith({
      name: "polyagent-1786163400000",
      model: DEFAULT_CLAUDE_MODEL,
      system: DEFAULT_AGENT_SYSTEM_PROMPT,
      tools: [{ type: CLAUDE_AGENT_TOOLSET }],
    });
    expect(anthropicSdk.createEnvironment).toHaveBeenCalledWith({
      name: "polyagent-1786163400000",
      config: {
        type: "cloud",
        networking: { type: "unrestricted" },
      },
    });
    expect(anthropicSdk.createSession).toHaveBeenCalledWith({
      agent: "agent-123",
      environment_id: "environment-456",
      title: "Fix the billing webhook",
    });
    expect(anthropicSdk.streamEvents).toHaveBeenCalledWith("session-789");
    expect(anthropicSdk.sendEvents).toHaveBeenCalledWith("session-789", {
      events: [
        {
          type: "user.message",
          content: [{ type: "text", text: "Fix the billing webhook\nInclude regression tests" }],
        },
      ],
    });
    expect(anthropicSdk.streamEvents.mock.invocationCallOrder[0]).toBeLessThan(
      anthropicSdk.sendEvents.mock.invocationCallOrder[0],
    );
    expect(result).toEqual({
      sessionId: "session-789",
      firstReply: "Ready to help.",
      status: "running",
    });
  });

  it("defaults a missing SDK session status to running", async () => {
    anthropicSdk.retrieveSession.mockResolvedValue({});

    await expect(realClaudePort("test-api-key").getStatus("session-123")).resolves.toEqual({
      status: "running",
    });
    expect(anthropicSdk.retrieveSession).toHaveBeenCalledWith("session-123");
  });

  it("sends a follow-up as a user message to the requested session", async () => {
    await realClaudePort("test-api-key").sendEvent("session-123", "Please also update the docs");

    expect(anthropicSdk.sendEvents).toHaveBeenCalledWith("session-123", {
      events: [
        {
          type: "user.message",
          content: [{ type: "text", text: "Please also update the docs" }],
        },
      ],
    });
  });
});
