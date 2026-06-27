import { StateStore } from "../state.js";
import { STATE_PATH } from "../config.js";
import { buildAdapter } from "../registry.js";
import { relativeTime, renderTable, type StatusRow } from "../format.js";

/**
 * Show all dispatched sessions (or one) in a unified table, polling each
 * vendor's live status. On a poll error, the last-known status is shown.
 */
export async function statusCommand(sessionId?: string): Promise<void> {
  const store = new StateStore(STATE_PATH);
  const sessions = sessionId ? store.list().filter((s) => s.id === sessionId) : store.list();

  if (sessions.length === 0) {
    console.log(
      sessionId
        ? `No session with id ${sessionId}.`
        : "No sessions yet. Dispatch one with `polyagent dispatch`.",
    );
    return;
  }

  const rows: StatusRow[] = await Promise.all(
    sessions.map(async (s) => {
      let status = s.status;
      let updatedAt = s.lastPolled ?? s.dispatchedAt;
      try {
        const live = await buildAdapter(s.vendor).getStatus(s.id);
        status = live.status;
        updatedAt = live.lastUpdate.toISOString();
        store.upsert({ ...s, status: live.status, lastPolled: updatedAt });
      } catch {
        // keep last-known status
      }
      return {
        vendor: s.vendor,
        id: s.id,
        label: s.label ?? "",
        status,
        lastUpdate: relativeTime(new Date(updatedAt)),
      };
    }),
  );

  console.log(renderTable(rows));
}
