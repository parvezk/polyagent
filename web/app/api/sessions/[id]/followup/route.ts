import { NextResponse } from "next/server";
import { StateStore, STATE_PATH, buildAdapter } from "@/lib/core";

export const dynamic = "force-dynamic";

// POST /api/sessions/:id/followup — { message }
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { message } = (await req.json().catch(() => ({}))) as { message?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const session = new StateStore(STATE_PATH).get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    await buildAdapter(session.vendor).sendFollowup(id, message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
