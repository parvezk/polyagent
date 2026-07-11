import { stdout } from "node:process";
import pc from "picocolors";
import { StateStore } from "../state.js";
import { STATE_PATH } from "../config.js";
import { buildAdapter } from "../registry.js";
import { relativeTime, renderTable, truncate } from "../format.js";
import { banner } from "../utils/banner.js";
const LABEL_MAX = 40;
const WATCH_INTERVAL_MS = 4000;
/** Poll every stored session's live status and build display rows. */
async function collectRows(store, sessionId) {
    const sessions = sessionId ? store.list().filter((s) => s.id === sessionId) : store.list();
    if (sessions.length === 0)
        return null;
    return Promise.all(sessions.map(async (s) => {
        let status = s.status;
        let updatedAt = s.lastPolled ?? s.dispatchedAt;
        try {
            const live = await buildAdapter(s.vendor).getStatus(s.id);
            status = live.status;
            updatedAt = live.lastUpdate.toISOString();
            store.upsert({ ...s, status: live.status, lastPolled: updatedAt });
        }
        catch {
            // keep last-known status
        }
        return {
            vendor: s.vendor,
            id: s.id,
            label: truncate(s.label ?? "", LABEL_MAX),
            status,
            lastUpdate: relativeTime(new Date(updatedAt)),
        };
    }));
}
function emptyMessage(sessionId) {
    return sessionId
        ? `No session with id ${sessionId}.`
        : "No sessions yet. Dispatch one with `polyagent dispatch`.";
}
export async function statusCommand(sessionId, opts = {}) {
    const store = new StateStore(STATE_PATH);
    const color = stdout.isTTY === true;
    if (!opts.watch) {
        const rows = await collectRows(store, sessionId);
        console.log(rows ? renderTable(rows, { color }) : emptyMessage(sessionId));
        return;
    }
    // --watch: redraw on an interval until Ctrl-C, with a sticky banner + pulse.
    let tick = 0;
    const render = async () => {
        const rows = await collectRows(store, sessionId);
        const now = new Date().toLocaleTimeString();
        console.clear();
        console.log(banner());
        console.log("");
        console.log(rows ? renderTable(rows, { color, tick }) : emptyMessage(sessionId));
        console.log(pc.dim(`\n⟳ refreshed ${now} · every ${WATCH_INTERVAL_MS / 1000}s · Ctrl-C to exit`));
        tick++;
    };
    await render();
    const timer = setInterval(render, WATCH_INTERVAL_MS);
    process.on("SIGINT", () => {
        clearInterval(timer);
        console.log(pc.dim("\nstopped watching."));
        process.exit(0);
    });
}
