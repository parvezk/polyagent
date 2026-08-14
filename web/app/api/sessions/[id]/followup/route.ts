import { NextResponse } from "next/server";
import { buildAdapter } from "@/lib/core";
import { getSession, patchSession, rekeySession } from "@/lib/sessions-store";

export const dynamic = "force-dynamic";

// POST /api/sessions/:id/followup — { message }
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { message } = (await req.json().catch(() => ({}))) as { message?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const session = await getSession(id); // RLS ensures it's the user's own
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const result = await buildAdapter(session.vendor).sendFollowup(id, message);
    const lastPolled = new Date().toISOString();
    const nextId = result.sessionId;

    if (nextId && nextId !== id) {
      // Gemini (and any future vendor that mints a new id) — re-key so polls
      // and output fetch the new interaction, not the completed prior turn.
      await rekeySession(id, nextId, { status: "running", last_polled: lastPolled });
      return NextResponse.json({ ok: true, sessionId: nextId });
    }

    await patchSession(id, { status: "running", last_polled: lastPolled });
    return NextResponse.json({ ok: true, sessionId: id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
