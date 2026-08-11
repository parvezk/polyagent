import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/sessions-store", () => ({
  listSessions: vi.fn(),
  patchSession: vi.fn(),
  upsertSessions: vi.fn(), // Fixed the typo in the mock export
}));

vi.mock("@/lib/core", () => ({
  buildAdapter: vi.fn(),
}));

import { GET } from "../web/app/api/sessions/route";
import { listSessions, patchSession, upsertSessions } from "../web/lib/sessions-store";
import { buildAdapter } from "../web/lib/core";
import { NextResponse } from "next/server";

describe("web/app/api/sessions GET optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("baseline performance", async () => {
    // Generate 100 sessions
    const sessions = Array.from({ length: 100 }, (_, i) => ({
      id: `session-${i}`,
      vendor: "claude",
      status: i < 5 ? "running" : "completed",
      dispatched_at: new Date().toISOString(),
      last_polled: null,
      label: `Test session ${i}`,
      output_url: null,
      first_message: null,
    }));

    vi.mocked(listSessions).mockResolvedValue(sessions as any);

    const getStatusMock = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        // add small synthetic delay to simulate network
        setTimeout(() => {
          resolve({
            status: "completed",
            lastUpdate: new Date(),
            summary: "Finished",
          });
        }, 10);
      });
    });

    vi.mocked(buildAdapter).mockReturnValue({
      getStatus: getStatusMock,
    } as any);

    const start = performance.now();
    const res = await GET();
    const end = performance.now();

    const data = await (res as NextResponse).json();

    console.log(`Execution time: ${(end - start).toFixed(2)}ms`);
    console.log(`Vendor API calls: ${getStatusMock.mock.calls.length}`);
    console.log(`DB Patch calls: ${vi.mocked(patchSession).mock.calls.length}`);
    console.log(`DB Upsert calls: ${vi.mocked(upsertSessions).mock.calls.length}`);

    expect(data.sessions).toHaveLength(100);
    expect(getStatusMock).toHaveBeenCalledTimes(5);
    expect(vi.mocked(patchSession)).toHaveBeenCalledTimes(0);
    expect(vi.mocked(upsertSessions)).toHaveBeenCalledTimes(1);
  });
});
