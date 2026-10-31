import { NextResponse } from "next/server";
import pLimit from "p-limit";
import { buildAdapter } from "@/lib/core";
import { listSessions, patchSession, type DbSession } from "@/lib/sessions-store";
import {
  countQueue,
  emptyCounts,
  groupFor,
  lastAgentMessage,
  repoFromUrl,
  type QueueItem,
  type QueueResponse,
} from "@/lib/queue";
import { isPersistableLiveStatus } from "@/lib/session-polling";
import type { SessionStatus } from "@/lib/view";

export const dynamic = "force-dynamic"; // always fresh; never cache live status

const CONCURRENCY_LIMIT = 5;

function isTerminal(status: string): boolean {
  return status === "completed" || status === "failed";
}

// GET /api/queue — every non-dismissed session, grouped by what needs the human.
export async function GET() {
  let sessions: DbSession[];
  try {
    sessions = await listSessions();
  } catch {
    // not authenticated yet → empty
    return NextResponse.json({ items: [], counts: emptyCounts() } satisfies QueueResponse);
  }

  const visible = sessions.filter((s) => !s.dismissed_at);
  const limit = pLimit(CONCURRENCY_LIMIT);
  const patchPromises: Promise<void>[] = [];

  const items = await Promise.all(
    visible.map((s) =>
      limit(async (): Promise<QueueItem> => {
        // buildAdapter throws when a vendor's key is missing; keep that run's stored state.
        let adapter: ReturnType<typeof buildAdapter> | null = null;
        try {
          adapter = buildAdapter(s.vendor);
        } catch {
          adapter = null;
        }
        let status = s.status as SessionStatus;
        let lastUpdate = s.last_polled ?? s.dispatched_at;
        let summary: string | undefined;
        let needsInput = false;

        // Status and output are independent; fetch them together.
        const statusTask =
          !adapter || isTerminal(s.status)
            ? Promise.resolve(null) // terminal sessions don't change state; skip polling
            : adapter.getStatus(s.id).catch(() => null); // keep last-known on error
        const outputTask = adapter
          ? adapter.getOutput(s.id).catch(() => null)
          : Promise.resolve(null);
        const [live, output] = await Promise.all([statusTask, outputTask]);

        // Adapters return "unknown" on vendor blips instead of throwing — do not
        // persist or display that sentinel over the last real status.
        if (live && isPersistableLiveStatus(live.status)) {
          summary = live.summary;
          needsInput = Boolean(live.needsInput);
          if (status !== live.status || s.last_polled === null) {
            status = live.status;
            lastUpdate = live.lastUpdate.toISOString();
            const patch = { status, last_polled: lastUpdate };
            patchPromises.push(
              patchSession(s.id, patch).catch((e) => {
                console.error("Failed to patch session:", e);
              }),
            );
          }
        }

        const message =
          lastAgentMessage(output?.messages) ??
          (summary?.trim() || undefined) ??
          (s.first_message?.trim() || undefined);

        return {
          id: s.id,
          vendor: s.vendor,
          label: s.label ?? "",
          status,
          dispatchedAt: s.dispatched_at,
          lastUpdate,
          summary,
          outputUrl: s.output_url ?? undefined,
          firstMessage: s.first_message ?? undefined,
          group: groupFor({ status, needsInput }),
          needsInput,
          repo: repoFromUrl(s.output_url),
          lastAgentMessage: message,
        };
      }),
    ),
  );

  if (patchPromises.length > 0) await Promise.all(patchPromises);

  return NextResponse.json({ items, counts: countQueue(items) } satisfies QueueResponse);
}
