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

  let fileSessions;
  try {
    fileSessions = new StateStore(STATE_PATH).list();
  } catch {
    // no state file (e.g. on Vercel) — nothing to import
    return NextResponse.json({ imported: 0 });
  }

  if (fileSessions.length === 0) {
    return NextResponse.json({ imported: 0 });
  }

  const rows = fileSessions.map((s) => toDbRow(s, userId));

  // Batch upserts to avoid payload limits on large state files. Each successful
  // batch is committed independently — count as we go so a mid-import failure
  // cannot report imported:0 after rows already landed in the DB.
  const BATCH_SIZE = 100;
  let imported = 0;
  try {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await upsertSessions(batch);
      imported += batch.length;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        imported,
        error:
          imported > 0
            ? `Import failed after ${imported} of ${rows.length} sessions: ${message}`
            : message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ imported });
}
