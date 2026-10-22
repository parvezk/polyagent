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
  let outputUrl = session.output_url ?? undefined;
  let messages: { role: string; content: string; timestamp: string }[] = [];

  // Skip status polling for terminal sessions, except Jules backfill when the
  // AUTO_CREATE_PR URL was never persisted onto the row.
  const needsPoll =
    (status !== "completed" && status !== "failed") ||
    (session.vendor === "jules" && !session.output_url);
  if (needsPoll) {
    try {
      const live = await adapter.getStatus(id);
      const liveLastUpdate = live.lastUpdate.toISOString();
      status = live.status;
      summary = live.summary;
      if (live.outputUrl) outputUrl = live.outputUrl;
      const statusChanged =
        status !== session.status ||
        liveLastUpdate !== (session.last_polled ?? session.dispatched_at);
      const outputChanged = !!live.outputUrl && live.outputUrl !== session.output_url;
      if (statusChanged || outputChanged) {
        await patchSession(id, {
          status,
          last_polled: liveLastUpdate,
          ...(live.outputUrl ? { output_url: live.outputUrl } : {}),
        });
      }
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
      outputUrl,
    },
    summary,
    firstMessage: session.first_message ?? undefined,
    messages,
  });
}
