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
      `${JULES_API_BASE}/sources?pageSize=100`,
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

  it("pages through Jules sources so repos beyond the first page can still dispatch", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          sources: [
            {
              name: "sources/page-1",
              githubRepo: {
                owner: "org",
                repo: "first-page-repo",
                defaultBranch: { displayName: "main" },
              },
            },
          ],
          nextPageToken: "page-2",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          sources: [
            {
              name: "sources/page-2-target",
              githubRepo: {
                owner: "parvezk",
                repo: "polyagent",
                defaultBranch: { displayName: "develop" },
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "session-paginated", state: "QUEUED" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await realJulesPort("test-api-key").createSession({
      prompt: "Use a repo from page two",
      repo: "parvezk/polyagent",
    });

    expect(result).toEqual({ sessionId: "session-paginated", state: "QUEUED" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${JULES_API_BASE}/sources?pageSize=100`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${JULES_API_BASE}/sources?pageSize=100&pageToken=page-2`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body)).sourceContext).toEqual({
      source: "sources/page-2-target",
      githubRepoContext: { startingBranch: "develop" },
    });
  });
});

describe("realJulesPort.listSources", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aggregates every page of connected GitHub sources", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          sources: [
            {
              name: "sources/a",
              githubRepo: { owner: "org", repo: "alpha", defaultBranch: { displayName: "main" } },
            },
          ],
          nextPageToken: "more",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          sources: [
            {
              name: "sources/b",
              githubRepo: { owner: "org", repo: "beta", defaultBranch: { displayName: "master" } },
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const sources = await realJulesPort("test-api-key").listSources();

    expect(sources).toEqual([
      { repo: "org/alpha", defaultBranch: "main" },
      { repo: "org/beta", defaultBranch: "master" },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("realJulesPort.getSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the session and preserves its explicit last message", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        state: "AWAITING_USER_FEEDBACK",
        lastMessage: "Which database should I use?",
        messages: [{ role: "agent", content: "Older message" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await realJulesPort("test-api-key").getSession("session-123");

    expect(result).toEqual({
      state: "AWAITING_USER_FEEDBACK",
      lastMessage: "Which database should I use?",
    });
    expect(fetchMock).toHaveBeenCalledWith(`${JULES_API_BASE}/sessions/session-123`, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": "test-api-key",
        "Content-Type": "application/json",
      },
    });
  });

  it("falls back to the last agent message", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        state: "IN_PROGRESS",
        messages: [
          { role: "agent", content: "First update" },
          { role: "human", content: "Please continue" },
          { role: "agent", content: "Latest agent update" },
          { role: "human", content: "Thanks" },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await realJulesPort("test-api-key").getSession("session-456");

    expect(result).toEqual({
      state: "IN_PROGRESS",
      lastMessage: "Latest agent update",
    });
  });

  it("defaults sessions without state or messages to queued", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse({})));

    const result = await realJulesPort("test-api-key").getSession("session-789");

    expect(result).toEqual({
      state: "QUEUED",
      lastMessage: undefined,
    });
  });
});
