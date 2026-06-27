import { NextResponse } from "next/server";
import { StateStore, STATE_PATH } from "@/lib/core";
import { currentUserId, toDbRow, upsertSession } from "@/lib/sessions-store";

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
    for (const s of fileSessions) {
      await upsertSession(toDbRow(s, userId));
      imported++;
    }
  } catch {
    // no state file (e.g. on Vercel) — nothing to import
  }

  return NextResponse.json({ imported });
}
