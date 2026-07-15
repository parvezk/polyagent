import { NextResponse } from "next/server";
import { buildAdapter } from "@/lib/core";
import { getSession, patchSession } from "@/lib/sessions-store";

export const dynamic = "force-dynamic";

// GET /api/sessions/:id — detail: live status + output/conversation (RLS-scoped).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const adapter = buildAdapter(session.vendor);
  let status = session.status;
  let summary: string | undefined;
  let messages: { role: string; content: string; timestamp: string }[] = [];

  // ⚡ Bolt: Skip unnecessary live polling for terminal states to reduce N+1 external API calls
  if (status !== "completed" && status !== "failed") {
    try {
      const live = await adapter.getStatus(id);
      status = live.status;
      summary = live.summary;
      await patchSession(id, { status: live.status, last_polled: live.lastUpdate.toISOString() });
    } catch {
      /* keep last-known */
    }
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
    session: {
      id: session.id,
      vendor: session.vendor,
      label: session.label ?? "",
      status,
      dispatchedAt: session.dispatched_at,
      lastUpdate: session.last_polled ?? session.dispatched_at,
      outputUrl: session.output_url ?? undefined,
    },
    summary,
    firstMessage: session.first_message ?? undefined,
    messages,
  });
}
