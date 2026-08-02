import { beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => ({
  currentUserId: vi.fn(),
  listSources: vi.fn(),
  realJulesPort: vi.fn(),
  resolveKey: vi.fn(),
}));

vi.mock("@/lib/core", () => ({
  realJulesPort: fakes.realJulesPort,
  resolveKey: fakes.resolveKey,
}));

vi.mock("@/lib/sessions-store", () => ({
  currentUserId: fakes.currentUserId,
}));

import { GET } from "../web/app/api/jules/sources/route.js";

describe("GET /api/jules/sources", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fakes.currentUserId.mockResolvedValue("user-123");
    fakes.resolveKey.mockReturnValue("jules-api-key");
    fakes.realJulesPort.mockReturnValue({ listSources: fakes.listSources });
  });

  it("rejects unauthenticated requests before accessing Jules", async () => {
    fakes.currentUserId.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Not authenticated" });
    expect(fakes.currentUserId).toHaveBeenCalledTimes(1);
    expect(fakes.resolveKey).not.toHaveBeenCalled();
    expect(fakes.realJulesPort).not.toHaveBeenCalled();
    expect(fakes.listSources).not.toHaveBeenCalled();
  });

  it("returns connected sources for an authenticated request", async () => {
    const sources = [
      {
        name: "sources/github-123",
        githubRepo: { owner: "parvezk", repo: "polyagent" },
      },
    ];
    fakes.listSources.mockResolvedValue(sources);

    const response = await GET();

    expect(fakes.currentUserId).toHaveBeenCalledTimes(1);
    expect(fakes.resolveKey).toHaveBeenCalledWith("jules");
    expect(fakes.realJulesPort).toHaveBeenCalledWith("jules-api-key");
    expect(fakes.listSources).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ sources });
  });
});
