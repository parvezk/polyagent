import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentSession } from "../src/types.js";

const supabase = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: supabase.createClient,
}));

import { toDbRow, upsertSessions, type DbSession } from "../web/lib/sessions-store";

function makeRow(id: string): DbSession {
  return {
    id,
    user_id: "user-1",
    vendor: "claude",
    label: null,
    status: "running",
    output_url: null,
    first_message: null,
    dispatched_at: "2026-07-11T12:00:00.000Z",
    last_polled: null,
  };
}

describe("web session store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.upsert.mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: supabase.upsert });
    supabase.createClient.mockResolvedValue({ from: supabase.from });
  });

  it("maps an imported session to a row scoped to the authenticated user", () => {
    const session: AgentSession = {
      id: "session-1",
      vendor: "jules",
      status: "completed",
      dispatchedAt: "2026-07-11T12:00:00.000Z",
    };

    expect(toDbRow(session, "user-42")).toEqual({
      id: "session-1",
      user_id: "user-42",
      vendor: "jules",
      label: null,
      status: "completed",
      output_url: null,
      first_message: null,
      dispatched_at: "2026-07-11T12:00:00.000Z",
      last_polled: null,
    });
  });

  it("does not create a database client for an empty import", async () => {
    await upsertSessions([]);

    expect(supabase.createClient).not.toHaveBeenCalled();
  });

  it("writes all imported rows in one bulk upsert", async () => {
    const rows = [makeRow("session-1"), makeRow("session-2")];

    await upsertSessions(rows);

    expect(supabase.createClient).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith("sessions");
    expect(supabase.upsert).toHaveBeenCalledTimes(1);
    expect(supabase.upsert).toHaveBeenCalledWith(rows);
  });

  it("surfaces a bulk upsert failure", async () => {
    supabase.upsert.mockResolvedValue({ error: { message: "database unavailable" } });

    await expect(upsertSessions([makeRow("session-1")])).rejects.toThrow("database unavailable");
  });
});
