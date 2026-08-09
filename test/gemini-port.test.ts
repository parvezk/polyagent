import { afterEach, describe, expect, it, vi } from "vitest";
import { realGeminiPort } from "../src/adapters/gemini-port.js";
import { ANTIGRAVITY_AGENT, GEMINI_API_BASE } from "../src/constants/gemini.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("realGeminiPort", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a remote background interaction with the requested agent", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        id: "interaction-123",
        status: "completed",
        output_text: "Finished the task.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await realGeminiPort("test-api-key").createInteraction({
      prompt: "Fix the import flow",
      modelId: "custom-agent",
    });

    expect(result).toEqual({
      interactionId: "interaction-123",
      status: "completed",
      firstReply: "Finished the task.",
    });
    expect(fetchMock).toHaveBeenCalledWith(`${GEMINI_API_BASE}/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": "test-api-key",
      },
      body: JSON.stringify({
        agent: "custom-agent",
        input: [{ type: "text", text: "Fix the import flow" }],
        environment: "remote",
        background: true,
      }),
    });
  });

  it("retrieves and normalizes interaction status", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        id: "interaction-123",
        status: "requires_action",
        output_text: "Please approve the plan.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await realGeminiPort("test-api-key").getStatus("interaction-123");

    expect(result).toEqual({
      status: "requires_action",
      summary: "Please approve the plan.",
    });
    expect(fetchMock).toHaveBeenCalledWith(`${GEMINI_API_BASE}/interactions/interaction-123`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": "test-api-key",
      },
    });
  });

  it("threads follow-ups through the previous interaction", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await realGeminiPort("test-api-key").sendFollowup(
      "interaction-123",
      "Apply the requested changes",
    );

    expect(fetchMock).toHaveBeenCalledWith(`${GEMINI_API_BASE}/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": "test-api-key",
      },
      body: JSON.stringify({
        agent: ANTIGRAVITY_AGENT,
        input: [{ type: "text", text: "Apply the requested changes" }],
        environment: "remote",
        background: true,
        previous_interaction_id: "interaction-123",
      }),
    });
  });

  it("surfaces non-successful API responses with request context", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("quota exhausted", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(realGeminiPort("test-api-key").getStatus("interaction-123")).rejects.toThrow(
      "Gemini API GET /interactions/interaction-123 → 429: quota exhausted",
    );
  });
});
