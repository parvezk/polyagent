import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync, renameSync, unlinkSync, } from "node:fs";
import { dirname } from "node:path";
export class StateStore {
    path;
    sessions = [];
    constructor(path) {
        this.path = path;
        this.load();
    }
    load() {
        if (!existsSync(this.path)) {
            this.sessions = [];
            return;
        }
        let raw;
        try {
            raw = readFileSync(this.path, "utf8");
        }
        catch (err) {
            throw new Error(`Failed to read state file at ${this.path}: ${err instanceof Error ? err.message : String(err)}`);
        }
        try {
            const data = JSON.parse(raw);
            this.sessions = data.sessions ?? [];
        }
        catch (err) {
            throw new Error(`Corrupt state file at ${this.path}: ${err instanceof Error ? err.message : String(err)}. ` +
                "Restore from backup or delete the file to start fresh.");
        }
    }
    save() {
        const dir = dirname(this.path);
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        const data = { sessions: this.sessions };
        // Write to a temp file then rename so a crash mid-write cannot truncate
        // the real state.json into unparseable garbage (esp. under status --watch).
        const tmp = `${this.path}.${process.pid}.tmp`;
        try {
            writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
            try {
                chmodSync(tmp, 0o600);
            }
            catch {
                /* ignore if we don't own it */
            }
            renameSync(tmp, this.path);
        }
        catch (err) {
            try {
                unlinkSync(tmp);
            }
            catch {
                /* best-effort cleanup */
            }
            throw err;
        }
        try {
            chmodSync(this.path, 0o600);
        }
        catch {
            /* ignore if we don't own it */
        }
    }
    upsert(session) {
        const i = this.sessions.findIndex((s) => s.id === session.id);
        if (i >= 0)
            this.sessions[i] = session;
        else
            this.sessions.push(session);
        this.save();
    }
    upsertMany(sessions) {
        for (const session of sessions) {
            const i = this.sessions.findIndex((s) => s.id === session.id);
            if (i >= 0)
                this.sessions[i] = session;
            else
                this.sessions.push(session);
        }
        if (sessions.length > 0) {
            this.save();
        }
    }
    list() {
        return [...this.sessions];
    }
    get(id) {
        return this.sessions.find((s) => s.id === id);
    }
}
