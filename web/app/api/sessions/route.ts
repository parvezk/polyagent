import { NextResponse } from "next/server";
import { buildAdapter } from "@/lib/core";
import { listSessions, patchSession } from "@/lib/sessions-store";

export const dynamic = "force-dynamic"; // always fresh; never cache live status

// GET /api/sessions — list the user's sessions (RLS-scoped), polling each vendor live.
export async function GET() {
  let sessions;
  try {
    sessions = await listSessions();
  } catch {
    // not authenticated yet → empty
    return NextResponse.json({ sessions: [] });
  }

  const rows = await Promise.all(
    sessions.map(async (s) => {
      let status = s.status;
      let lastUpdate = s.last_polled ?? s.dispatched_at;
      let summary: string | undefined;
      try {
        const live = await buildAdapter(s.vendor).getStatus(s.id);
        const liveStatus = live.status;
        const liveLastUpdate = live.lastUpdate.toISOString();

        status = liveStatus;
        lastUpdate = liveLastUpdate;
        summary = live.summary;

        // Optimization: Only patch the session in the database if the status or lastUpdate timestamp actually changed, avoiding redundant database writes
        if (liveStatus !== s.status || liveLastUpdate !== s.last_polled) {
          await patchSession(s.id, { status: liveStatus, last_polled: liveLastUpdate });
        }
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

  return NextResponse.json({ sessions: rows });
}
