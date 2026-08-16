import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { realClaudePort } from "../src/adapters/claude-port.js";
import { CLAUDE_AGENT_TOOLSET, DEFAULT_AGENT_SYSTEM_PROMPT } from "../src/constants/claude.js";

const anthropicSdk = vi.hoisted(() => ({
  construct: vi.fn(),
  createAgent: vi.fn(),
  createEnvironment: vi.fn(),
  createSession: vi.fn(),
  retrieveSession: vi.fn(),
  listEvents: vi.fn(),
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
          list: anthropicSdk.listEvents,
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

function eventPage(events: unknown[]) {
  return {
    getPaginatedItems: () => events,
    [Symbol.asyncIterator]: async function* () {
      for (const event of events) yield event;
    },
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
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
    const streamReady = deferred<AsyncIterable<unknown>>();
    anthropicSdk.streamEvents.mockReturnValue(streamReady.promise);

    const resultPromise = realClaudePort("test-api-key").createSession({
      prompt: "Fix the billing webhook\nInclude regression tests",
      modelId: "claude-sonnet-5",
    });

    await vi.waitFor(() => expect(anthropicSdk.streamEvents).toHaveBeenCalledWith("session-789"));
    expect(anthropicSdk.sendEvents).not.toHaveBeenCalled();

    streamReady.resolve(
      eventStream([
        {
          type: "agent.message",
          content: [
            { type: "text", text: "Ready " },
            { type: "text", text: "to help." },
          ],
        },
      ]),
    );
    const result = await resultPromise;

    expect(anthropicSdk.construct).toHaveBeenCalledWith({ apiKey: "test-api-key" });
    expect(anthropicSdk.createAgent).toHaveBeenCalledWith({
      name: "polyagent-1786163400000",
      model: "claude-sonnet-5",
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
    expect(result).toEqual({
      sessionId: "session-789",
      firstReply: "Ready to help.",
      status: "running",
    });
  });

  it("defaults a missing SDK session status to running", async () => {
    anthropicSdk.retrieveSession.mockResolvedValue({});
    anthropicSdk.listEvents.mockResolvedValue(eventPage([]));

    await expect(realClaudePort("test-api-key").getStatus("session-123")).resolves.toEqual({
      status: "running",
    });
    expect(anthropicSdk.retrieveSession).toHaveBeenCalledWith("session-123");
  });

  it("includes the latest agent.message text as summary", async () => {
    anthropicSdk.retrieveSession.mockResolvedValue({ status: "idle" });
    anthropicSdk.listEvents.mockResolvedValue(
      eventPage([
        {
          type: "agent.message",
          content: [{ type: "text", text: "Opened the PR." }],
          processed_at: "2026-08-16T11:00:00.000Z",
        },
      ]),
    );

    await expect(realClaudePort("test-api-key").getStatus("session-123")).resolves.toEqual({
      status: "idle",
      summary: "Opened the PR.",
    });
    expect(anthropicSdk.listEvents).toHaveBeenCalledWith("session-123", {
      types: ["agent.message"],
      order: "desc",
      limit: 1,
    });
  });

  it("still returns status when listing events fails", async () => {
    anthropicSdk.retrieveSession.mockResolvedValue({ status: "running" });
    anthropicSdk.listEvents.mockRejectedValue(new Error("events unavailable"));

    await expect(realClaudePort("test-api-key").getStatus("session-123")).resolves.toEqual({
      status: "running",
    });
  });

  it("lists chronological user and agent messages for getOutput", async () => {
    anthropicSdk.listEvents.mockReturnValue(
      eventStream([
        {
          type: "user.message",
          content: [{ type: "text", text: "Please continue" }],
          processed_at: "2026-08-16T10:00:00.000Z",
        },
        {
          type: "agent.message",
          content: [
            { type: "text", text: "Done " },
            { type: "text", text: "now." },
          ],
          processed_at: "2026-08-16T10:01:00.000Z",
        },
      ]),
    );

    await expect(realClaudePort("test-api-key").listMessages("session-123")).resolves.toEqual({
      messages: [
        {
          role: "human",
          content: "Please continue",
          timestamp: "2026-08-16T10:00:00.000Z",
        },
        {
          role: "agent",
          content: "Done now.",
          timestamp: "2026-08-16T10:01:00.000Z",
        },
      ],
    });
    expect(anthropicSdk.listEvents).toHaveBeenCalledWith("session-123", {
      types: ["user.message", "agent.message"],
      order: "asc",
    });
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
