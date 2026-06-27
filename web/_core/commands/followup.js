import pc from "picocolors";
import { StateStore } from "../state.js";
import { STATE_PATH } from "../config.js";
import { buildAdapter } from "../registry.js";
/** Send a follow-up message to a running session (Claude or Jules). */
export async function followupCommand(sessionId, message) {
    const store = new StateStore(STATE_PATH);
    const session = store.get(sessionId);
    if (!session) {
        console.error(`No session with id ${sessionId}. Run \`polyagent status\` to list sessions.`);
        process.exitCode = 1;
        return;
    }
    try {
        await buildAdapter(session.vendor).sendFollowup(sessionId, message);
        console.log(pc.green(`✓ Sent follow-up to ${session.vendor} session ${sessionId}`));
        console.log(pc.dim(`  Track with: polyagent status --watch`));
    }
    catch (err) {
        console.error(pc.red(`Follow-up failed: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
    }
}
