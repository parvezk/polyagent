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

      // ⚡ BOLT OPTIMIZATION:
      // 1. Skip vendor polling for terminal sessions (saves O(N) network requests)
      // 2. Only patch DB when status actually changes (saves O(N) database writes)
      if (status !== "completed" && status !== "failed") {
        try {
          const live = await buildAdapter(s.vendor).getStatus(s.id);
          status = live.status;
          lastUpdate = live.lastUpdate.toISOString();
          summary = live.summary;

          if (s.status !== live.status || !s.last_polled) {
            await patchSession(s.id, { status: live.status, last_polled: lastUpdate });
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
  );

  return NextResponse.json({ sessions: rows });
}
