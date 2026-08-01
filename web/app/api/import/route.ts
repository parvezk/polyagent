import { NextResponse } from "next/server";
import { StateStore, STATE_PATH } from "@/lib/core";
import { currentUserId, toDbRow, upsertSessions } from "@/lib/sessions-store";

export const dynamic = "force-dynamic";

// POST /api/import — one-time import of CLI sessions (~/.polyagent/state.json) into
// the logged-in user's account. Local-only convenience (no file on Vercel).
export async function POST() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let imported = 0;
  try {
    const fileSessions = new StateStore(STATE_PATH).list();
    if (fileSessions.length > 0) {
      const rows = fileSessions.map((s) => toDbRow(s, userId));
      const BATCH_SIZE = 100;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await upsertSessions(rows.slice(i, i + BATCH_SIZE));
      }
      imported = rows.length;
    }
  } catch {
    // no state file (e.g. on Vercel) — nothing to import
  }

  return NextResponse.json({ imported });
}
