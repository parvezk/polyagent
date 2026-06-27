import { NextResponse } from "next/server";
import { StateStore, STATE_PATH, buildAdapter } from "@/lib/core";

export const dynamic = "force-dynamic";

// GET /api/sessions/:id — detail: live status + output/conversation.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const store = new StateStore(STATE_PATH);
  const session = store.get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const adapter = buildAdapter(session.vendor);
  let status = session.status;
  let summary: string | undefined;
  let messages: { role: string; content: string; timestamp: string }[] = [];

  try {
    const live = await adapter.getStatus(id);
    status = live.status;
    summary = live.summary;
    store.upsert({ ...session, status: live.status, lastPolled: live.lastUpdate.toISOString() });
  } catch {
    /* keep last-known */
  }

  try {
    const output = await adapter.getOutput(id);
    messages = output.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));
  } catch {
    /* output may be unavailable */
  }

  return NextResponse.json({
    session: { ...session, status },
    summary,
    firstMessage: session.firstMessage,
    messages,
  });
}
