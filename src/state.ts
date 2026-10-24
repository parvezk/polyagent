import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  chmodSync,
  renameSync,
  unlinkSync,
} from "node:fs";
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
    let raw: string;
    try {
      raw = readFileSync(this.path, "utf8");
    } catch (err) {
      throw new Error(
        `Failed to read state file at ${this.path}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    try {
      const data = JSON.parse(raw) as StateFile;
      this.sessions = data.sessions ?? [];
    } catch (err) {
      throw new Error(
        `Corrupt state file at ${this.path}: ${err instanceof Error ? err.message : String(err)}. ` +
          "Restore from backup or delete the file to start fresh.",
      );
    }
  }

  save(): void {
    const dir = dirname(this.path);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const data: StateFile = { sessions: this.sessions };
    // Write to a temp file then rename so a crash mid-write cannot truncate
    // the real state.json into unparseable garbage (esp. under status --watch).
    const tmp = `${this.path}.${process.pid}.tmp`;
    try {
      writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
      try {
        chmodSync(tmp, 0o600);
      } catch {
        /* ignore if we don't own it */
      }
      renameSync(tmp, this.path);
    } catch (err) {
      try {
        unlinkSync(tmp);
      } catch {
        /* best-effort cleanup */
      }
      throw err;
    }
    try {
      chmodSync(this.path, 0o600);
    } catch {
      /* ignore if we don't own it */
    }
  }

  upsert(session: AgentSession): void {
    const i = this.sessions.findIndex((s) => s.id === session.id);
    if (i >= 0) this.sessions[i] = session;
    else this.sessions.push(session);
    this.save();
  }

  upsertMany(sessions: AgentSession[]): void {
    for (const session of sessions) {
      const i = this.sessions.findIndex((s) => s.id === session.id);
      if (i >= 0) this.sessions[i] = session;
      else this.sessions.push(session);
    }
    if (sessions.length > 0) {
      this.save();
    }
  }

  list(): AgentSession[] {
    return [...this.sessions];
  }

  get(id: string): AgentSession | undefined {
    return this.sessions.find((s) => s.id === id);
  }
}
