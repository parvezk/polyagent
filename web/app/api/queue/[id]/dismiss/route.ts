import { NextResponse } from "next/server";
import { currentUserId, dismissSession, getSession } from "@/lib/sessions-store";

export const dynamic = "force-dynamic";

// POST /api/queue/:id/dismiss — hide a session from the queue (sets dismissed_at).
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    await dismissSession(id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not dismiss this run.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
