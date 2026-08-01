import { NextResponse } from "next/server";
import { buildAdapter } from "@/lib/core";
import { listSessions, upsertSessions, type DbSession } from "@/lib/sessions-store";

export const dynamic = "force-dynamic"; // always fresh; never cache live status

// GET /api/sessions — list the user's sessions (RLS-scoped), polling each vendor live.
export async function GET() {
  let sessions: DbSession[];
  try {
    sessions = await listSessions();
  } catch {
    // not authenticated yet → empty
    return NextResponse.json({ sessions: [] });
  }

  const updates: DbSession[] = [];

  const rows = await Promise.all(
    sessions.map(async (s) => {
      let status = s.status;
      let lastUpdate = s.last_polled ?? s.dispatched_at;
      let summary: string | undefined;

      try {
        const live = await buildAdapter(s.vendor).getStatus(s.id);
        const newStatus = live.status;
        const newLastUpdate = live.lastUpdate.toISOString();
        summary = live.summary;

        // Skip redundant database writes for unchanged terminal sessions
        const isUnchangedTerminal =
          (s.status === "completed" || s.status === "failed") &&
          newStatus === s.status;

        if (!isUnchangedTerminal) {
          updates.push({ ...s, status: newStatus, last_polled: newLastUpdate });
        }

        status = newStatus;
        lastUpdate = newLastUpdate;
      } catch {
        // keep last-known status
      }
      return {
        id: s.id,
        vendor: s.vendor,
        label: s.label ?? "",
        status,
        dispatchedAt: s.dispatched_at,
        lastUpdate,
        summary,
        outputUrl: s.output_url ?? undefined,
        firstMessage: s.first_message ?? undefined,
      };
    }),
  );

  if (updates.length > 0) {
    try {
      await upsertSessions(updates);
    } catch (e) {
      console.error("Failed to batch update sessions", e);
    }
  }

  return NextResponse.json({ sessions: rows });
}
