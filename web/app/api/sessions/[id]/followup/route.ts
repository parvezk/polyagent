import { NextResponse } from "next/server";
import { buildAdapter } from "@/lib/core";
import { getSession } from "@/lib/sessions-store";

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
    await buildAdapter(session.vendor).sendFollowup(id, message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // SECURITY: Log error internally but return generic message to client to prevent info leakage
    console.error("Follow-up error:", err);
    return NextResponse.json(
      { error: "An internal error occurred" },
      { status: 502 },
    );
  }
}
