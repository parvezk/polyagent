import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
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
    mkdirSync(dirname(this.path), { recursive: true });
    const data = { sessions: this.sessions };
    writeFileSync(this.path, JSON.stringify(data, null, 2));
  }
  upsert(session) {
    const i = this.sessions.findIndex((s) => s.id === session.id);
    if (i >= 0) this.sessions[i] = session;
    else this.sessions.push(session);
    this.save();
  }
  list() {
    return [...this.sessions];
  }
  get(id) {
    return this.sessions.find((s) => s.id === id);
  }
}
