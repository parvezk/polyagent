import { NextResponse } from "next/server";
import { buildAdapter } from "@/lib/core";
import { listSessions, patchSession, type DbSession } from "@/lib/sessions-store";
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
  const patchPromises: Promise<void>[] = [];

  const rows = await Promise.all(
    sessions.map((s) =>
      limit(async () => {
        let status = s.status;
        let lastUpdate = s.last_polled ?? s.dispatched_at;
        let summary: string | undefined;
        let outputUrl = s.output_url ?? undefined;

        // Skip polling terminal sessions to avoid unnecessary vendor calls and DB writes.
        if (status !== "completed" && status !== "failed") {
          try {
            const live = await buildAdapter(s.vendor).getStatus(s.id);
            const liveLastUpdate = live.lastUpdate.toISOString();
            summary = live.summary;
            if (live.outputUrl) outputUrl = live.outputUrl;

            // Persist status changes, first poll timestamp, or a newly discovered PR URL.
            const statusChanged = status !== live.status || s.last_polled === null;
            const outputChanged = !!live.outputUrl && live.outputUrl !== s.output_url;
            if (statusChanged || outputChanged) {
              status = live.status;
              lastUpdate = liveLastUpdate;

              patchPromises.push(
                (async () => {
                  try {
                    await patchSession(s.id, {
                      status,
                      last_polled: lastUpdate,
                      ...(live.outputUrl ? { output_url: live.outputUrl } : {}),
                    });
                  } catch (e) {
                    console.error("Failed to patch session:", e);
                  }
                })(),
              );
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
          outputUrl,
          firstMessage: s.first_message ?? undefined,
        };
      }),
    ),
  );

  if (patchPromises.length > 0) {
    await Promise.all(patchPromises);
  }

  return NextResponse.json({ sessions: rows });
}
