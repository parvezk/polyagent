import { afterEach, describe, expect, it, vi } from "vitest";
import { extractGeminiOutputText, realGeminiPort } from "../src/adapters/gemini-port.js";
import { ANTIGRAVITY_AGENT, GEMINI_API_BASE } from "../src/constants/gemini.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("extractGeminiOutputText", () => {
  it("prefers SDK output_text when present", () => {
    expect(
      extractGeminiOutputText({
        output_text: "From SDK",
        steps: [{ type: "model_output", content: [{ type: "text", text: "From steps" }] }],
      }),
    ).toBe("From SDK");
  });

  it("extracts the latest model_output text from REST steps", () => {
    expect(
      extractGeminiOutputText({
        steps: [
          { type: "thought", content: [{ type: "text", text: "thinking" }] },
          {
            type: "model_output",
            content: [
              { type: "text", text: "Hello " },
              { type: "text", text: "world" },
            ],
          },
        ],
      }),
    ).toBe("Hello world");
  });

  it("stops at user_input when scanning backwards", () => {
    expect(
      extractGeminiOutputText({
        steps: [
          { type: "model_output", content: [{ type: "text", text: "old reply" }] },
          { type: "user_input", content: [{ type: "text", text: "next" }] },
          { type: "model_output", content: [{ type: "text", text: "new reply" }] },
        ],
      }),
    ).toBe("new reply");
  });

  it("returns undefined when there is no model text", () => {
    expect(extractGeminiOutputText({ steps: [{ type: "thought" }] })).toBeUndefined();
    expect(extractGeminiOutputText({})).toBeUndefined();
  });
});

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

  it("reads firstReply from REST steps when output_text is absent", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        id: "interaction-123",
        status: "completed",
        steps: [
          {
            type: "model_output",
            content: [{ type: "text", text: "Finished via steps." }],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await realGeminiPort("test-api-key").createInteraction({
      prompt: "Fix the import flow",
    });

    expect(result.firstReply).toBe("Finished via steps.");
  });

  it("uses the default agent when no model is requested", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        id: "interaction-123",
        status: "in_progress",
        output_text: "",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await realGeminiPort("test-api-key").createInteraction({
      prompt: "Fix the import flow",
    });

    const request = fetchMock.mock.calls[0];
    expect(JSON.parse(String(request?.[1]?.body)).agent).toBe(ANTIGRAVITY_AGENT);
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

  it("summarizes status from REST steps when output_text is absent", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        id: "interaction-123",
        status: "completed",
        steps: [
          {
            type: "model_output",
            content: [{ type: "text", text: "Done via REST steps." }],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await realGeminiPort("test-api-key").getStatus("interaction-123");
    expect(result.summary).toBe("Done via REST steps.");
  });

  it("reuses the prior environment_id on follow-up instead of environment:remote", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          id: "interaction-123",
          status: "completed",
          environment_id: "env-abc",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "interaction-456", status: "in_progress" }));
    vi.stubGlobal("fetch", fetchMock);

    await realGeminiPort("test-api-key").sendFollowup(
      "interaction-123",
      "Apply the requested changes",
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${GEMINI_API_BASE}/interactions/interaction-123`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": "test-api-key",
        },
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${GEMINI_API_BASE}/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": "test-api-key",
      },
      body: JSON.stringify({
        agent: ANTIGRAVITY_AGENT,
        input: [{ type: "text", text: "Apply the requested changes" }],
        environment: "env-abc",
        background: true,
        previous_interaction_id: "interaction-123",
      }),
    });
  });

  it("rejects follow-up when the prior interaction has no environment_id", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        id: "interaction-123",
        status: "completed",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      realGeminiPort("test-api-key").sendFollowup("interaction-123", "continue"),
    ).rejects.toThrow(/no environment_id/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
