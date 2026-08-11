import { afterEach, describe, expect, it, vi } from "vitest";
import { realJulesPort } from "../src/adapters/jules-port.js";
import { JULES_API_BASE } from "../src/constants/jules.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("realJulesPort.createSession payload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a repo-less session without looking up sources", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ name: "sessions/session-123", state: "QUEUED" }));
    vi.stubGlobal("fetch", fetchMock);

    await realJulesPort("test-api-key").createSession({
      prompt: "Investigate the production alert",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      `${JULES_API_BASE}/sessions`,
      expect.objectContaining({ method: "POST" }),
    );

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody).not.toHaveProperty("sourceContext");
  });

  it("creates a session when the registered source has no default branch", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          sources: [
            {
              name: "sources/github-123",
              githubRepo: {
                owner: "parvezk",
                repo: "polyagent",
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "session-456", state: "IN_PROGRESS" }));
    vi.stubGlobal("fetch", fetchMock);

    await realJulesPort("test-api-key").createSession({
      prompt: "Fix the import flow",
      repo: "parvezk/polyagent",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const requestBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(requestBody.sourceContext).toEqual({
      source: "sources/github-123",
      githubRepoContext: {},
    });
  });
});
