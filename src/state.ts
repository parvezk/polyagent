import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
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
    mkdirSync(dirname(this.path), { recursive: true });
    const data: StateFile = { sessions: this.sessions };
    writeFileSync(this.path, JSON.stringify(data, null, 2));
  }

  upsert(session: AgentSession): void {
    const i = this.sessions.findIndex((s) => s.id === session.id);
    if (i >= 0) this.sessions[i] = session;
    else this.sessions.push(session);
    this.save();
  }

  list(): AgentSession[] {
    return [...this.sessions];
  }

  get(id: string): AgentSession | undefined {
    return this.sessions.find((s) => s.id === id);
  }
}
