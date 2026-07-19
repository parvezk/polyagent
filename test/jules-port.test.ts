import { afterEach, describe, expect, it, vi } from "vitest";
import { JULES_API_BASE } from "../src/constants/jules.js";
import { realJulesPort } from "../src/adapters/jules-port.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("realJulesPort.createSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("matches GitHub sources case-insensitively and uses the source default branch", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          sources: [
            {
              name: "sources/wrong-repo",
              githubRepo: {
                owner: "ParvezK",
                repo: "AnotherRepo",
                defaultBranch: { displayName: "wrong-repo-branch" },
              },
            },
            {
              name: "sources/wrong-owner",
              githubRepo: {
                owner: "AnotherOwner",
                repo: "PolyAgent",
                defaultBranch: { displayName: "wrong-owner-branch" },
              },
            },
            {
              name: "sources/github-123",
              githubRepo: {
                owner: "ParvezK",
                repo: "PolyAgent",
                defaultBranch: { displayName: "develop" },
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ name: "sessions/session-123", state: "IN_PROGRESS" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await realJulesPort("test-api-key").createSession({
      prompt: "Fix the import flow",
      repo: "PARVEZK/POLYAGENT",
    });

    expect(result).toEqual({ sessionId: "session-123", state: "IN_PROGRESS" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${JULES_API_BASE}/sources`,
      expect.objectContaining({ method: "GET" }),
    );

    const createRequest = fetchMock.mock.calls[1];
    expect(createRequest?.[0]).toBe(`${JULES_API_BASE}/sessions`);
    expect(JSON.parse(String(createRequest?.[1]?.body)).sourceContext).toEqual({
      source: "sources/github-123",
      githubRepoContext: { startingBranch: "develop" },
    });
  });

  it("prefers the requested branch over the source default branch", async () => {
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
                defaultBranch: { displayName: "main" },
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "session-456", state: "QUEUED" }));
    vi.stubGlobal("fetch", fetchMock);

    await realJulesPort("test-api-key").createSession({
      prompt: "Test the feature branch",
      repo: "parvezk/polyagent",
      branch: "feature/regression-test",
    });

    const createRequest = fetchMock.mock.calls[1];
    expect(JSON.parse(String(createRequest?.[1]?.body)).sourceContext).toEqual({
      source: "sources/github-123",
      githubRepoContext: { startingBranch: "feature/regression-test" },
    });
  });

  it("rejects an unregistered repository before creating a session", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        sources: [
          {
            name: "sources/github-123",
            githubRepo: { owner: "other", repo: "registered-repo" },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      realJulesPort("test-api-key").createSession({
        prompt: "Do not dispatch this",
        repo: "parvezk/polyagent",
      }),
    ).rejects.toThrow(
      'Jules has no source for "parvezk/polyagent". Install the Jules GitHub App and select the repo in Jules. Available: other/registered-repo',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
