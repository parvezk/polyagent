import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";
import type { AgentSession } from "./types.js";

interface StateFile {
  sessions: AgentSession[];
}

export class StateStore {
  private sessions: AgentSession[] = [];

  constructor(private readonly path: string) {
    this.load();
  }

  load(): void {
    if (!existsSync(this.path)) {
      this.sessions = [];
      return;
    }
    const data = JSON.parse(readFileSync(this.path, "utf8")) as StateFile;
    this.sessions = data.sessions ?? [];
  }

  save(): void {
    const dir = dirname(this.path);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const data: StateFile = { sessions: this.sessions };
    writeFileSync(this.path, JSON.stringify(data, null, 2), { mode: 0o600 });
    try {
      chmodSync(this.path, 0o600);
    } catch {
      /* ignore if we don't own it */
    }
  }

  upsert(session: AgentSession): void {
    // Reload so concurrent writers (e.g. dispatch while status --watch runs)
    // are not clobbered by a full-file save from stale memory.
    this.load();
    const i = this.sessions.findIndex((s) => s.id === session.id);
    if (i >= 0) this.sessions[i] = session;
    else this.sessions.push(session);
    this.save();
  }

  upsertMany(sessions: AgentSession[]): void {
    if (sessions.length === 0) return;
    this.load();
    for (const session of sessions) {
      const i = this.sessions.findIndex((s) => s.id === session.id);
      if (i >= 0) this.sessions[i] = session;
      else this.sessions.push(session);
    }
    this.save();
  }

  list(): AgentSession[] {
    return [...this.sessions];
  }

  get(id: string): AgentSession | undefined {
    return this.sessions.find((s) => s.id === id);
  }
}
