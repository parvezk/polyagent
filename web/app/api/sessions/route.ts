import { NextResponse } from "next/server";
import { StateStore, STATE_PATH, buildAdapter } from "@/lib/core";

export const dynamic = "force-dynamic"; // always fresh; never cache live status

// GET /api/sessions — list all sessions, polling each vendor for live status.
export async function GET() {
  const store = new StateStore(STATE_PATH);
  const sessions = store.list();

  const rows = await Promise.all(
    sessions.map(async (s) => {
      let status = s.status;
      let lastUpdate = s.lastPolled ?? s.dispatchedAt;
      let summary: string | undefined;
      try {
        const live = await buildAdapter(s.vendor).getStatus(s.id);
        status = live.status;
        lastUpdate = live.lastUpdate.toISOString();
        summary = live.summary;
        store.upsert({ ...s, status: live.status, lastPolled: lastUpdate });
      } catch {
        // keep last-known status
      }
      return {
        id: s.id,
        vendor: s.vendor,
        label: s.label ?? "",
        status,
        dispatchedAt: s.dispatchedAt,
        lastUpdate,
        summary,
        outputUrl: s.outputUrl,
        firstMessage: s.firstMessage,
      };
    }),
  );

  // newest first
  rows.sort((a, b) => b.dispatchedAt.localeCompare(a.dispatchedAt));
  return NextResponse.json({ sessions: rows });
}
