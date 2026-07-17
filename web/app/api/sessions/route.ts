import { NextResponse } from "next/server";
import { buildAdapter } from "@/lib/core";
import { currentUserId, listSessions, patchSession } from "@/lib/sessions-store";

export const dynamic = "force-dynamic"; // always fresh; never cache live status

// GET /api/sessions — list the user's sessions (RLS-scoped), polling each vendor live.
export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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
        status = live.status;
        lastUpdate = live.lastUpdate.toISOString();
        summary = live.summary;
        await patchSession(s.id, { status: live.status, last_polled: lastUpdate });
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
