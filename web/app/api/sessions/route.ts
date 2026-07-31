import { NextResponse } from "next/server";
import { buildAdapter } from "@/lib/core";
import { listSessions, upsertSessions, type DbSession } from "@/lib/sessions-store";
import pLimit from "p-limit";

export const dynamic = "force-dynamic"; // always fresh; never cache live status

const CONCURRENCY_LIMIT = 5;

// GET /api/sessions — list the user's sessions (RLS-scoped), polling each vendor live.
export async function GET() {
  let sessions: DbSession[];
  try {
    sessions = await listSessions();
  } catch {
    // not authenticated yet → empty
    return NextResponse.json({ sessions: [] });
  }

  const limit = pLimit(CONCURRENCY_LIMIT);
  const updatedSessions: DbSession[] = [];

  const rows = await Promise.all(
    sessions.map((s) =>
      limit(async () => {
        let status = s.status;
        let lastUpdate = s.last_polled ?? s.dispatched_at;
        let summary: string | undefined;

        // Skip polling if the session is already in a terminal state
        if (status !== "completed" && status !== "failed") {
          try {
            const live = await buildAdapter(s.vendor).getStatus(s.id);
            const liveLastUpdate = live.lastUpdate.toISOString();

            // Only flag for update if something changed
            if (status !== live.status || lastUpdate !== liveLastUpdate) {
              status = live.status;
              lastUpdate = liveLastUpdate;
              summary = live.summary;

              // We need to keep all fields intact for upsert, so copy the original session
              // and update only the fields that changed.
              updatedSessions.push({
                ...s,
                status,
                last_polled: lastUpdate,
              });
            } else {
              summary = live.summary;
            }
          } catch {
            // keep last-known status
          }
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
    ),
  );

  if (updatedSessions.length > 0) {
    try {
      await upsertSessions(updatedSessions);
    } catch (e) {
      console.error("Failed to bulk upsert sessions:", e);
    }
  }

  return NextResponse.json({ sessions: rows });
}
