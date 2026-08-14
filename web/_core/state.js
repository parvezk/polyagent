import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
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
        const data = JSON.parse(readFileSync(this.path, "utf8"));
        this.sessions = data.sessions ?? [];
    }
    save() {
        const dir = dirname(this.path);
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        const data = { sessions: this.sessions };
        writeFileSync(this.path, JSON.stringify(data, null, 2), { mode: 0o600 });
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
    /** Replace a session's vendor-native id (e.g. Gemini follow-up minting a new interaction). */
    rekey(oldId, next) {
        const i = this.sessions.findIndex((s) => s.id === oldId);
        if (i >= 0)
            this.sessions[i] = next;
        else
            this.sessions.push(next);
        this.save();
    }
}
