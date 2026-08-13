import { describe, it, expect, beforeEach } from "vitest";
import { chmodSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { StateStore } from "../src/state.js";
import type { AgentSession } from "../src/types.js";

function makeSession(id: string): AgentSession {
  return { id, vendor: "claude", status: "running", dispatchedAt: "2026-06-23T00:00:00Z" };
}

function mode(path: string): number {
  return statSync(path).mode & 0o777;
}

describe("StateStore", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "pa-"));
  });

  it("upserts and lists sessions, persisting to disk", () => {
    const path = join(dir, "state.json");
    const store = new StateStore(path);
    store.upsert(makeSession("a"));
    store.upsert(makeSession("b"));
    expect(store.list().map((s) => s.id)).toEqual(["a", "b"]);

    const reloaded = new StateStore(path);
    expect(reloaded.list().map((s) => s.id)).toEqual(["a", "b"]);
  });

  it.skipIf(process.platform === "win32")("creates private state storage", () => {
    const stateDir = join(dir, ".polyagent");
    const path = join(stateDir, "state.json");
    const previousUmask = process.umask(0);

    try {
      new StateStore(path).upsert(makeSession("private"));
    } finally {
      process.umask(previousUmask);
    }

    expect(statSync(stateDir).mode & 0o777).toBe(0o700);
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });

  it("upsert replaces an existing session by id", () => {
    const store = new StateStore(join(dir, "state.json"));
    store.upsert(makeSession("a"));
    store.upsert({ ...makeSession("a"), status: "completed" });
    expect(store.list()).toHaveLength(1);
    expect(store.get("a")?.status).toBe("completed");
  });

  it("returns empty list when no state file exists", () => {
    const store = new StateStore(join(dir, "missing.json"));
    expect(store.list()).toEqual([]);
    expect(store.get("nope")).toBeUndefined();
  });

  it("creates state directory and file with private permissions", () => {
    const stateDir = join(dir, "state");
    const statePath = join(stateDir, "state.json");
    const store = new StateStore(statePath);

    store.upsert(makeSession("a"));

    expect(mode(stateDir)).toBe(0o700);
    expect(mode(statePath)).toBe(0o600);
  });

  it("tightens permissions on an existing state file", () => {
    const statePath = join(dir, "state.json");
    writeFileSync(statePath, JSON.stringify({ sessions: [] }), { mode: 0o644 });
    chmodSync(statePath, 0o644);

    const store = new StateStore(statePath);
    store.upsert(makeSession("a"));

    expect(mode(statePath)).toBe(0o600);
  });

  it("upsertMany replaces/inserts multiple sessions and saves once", () => {
    const store = new StateStore(join(dir, "state.json"));
    store.upsert(makeSession("a"));
    store.upsert(makeSession("b"));

    store.upsertMany([{ ...makeSession("a"), status: "completed" }, makeSession("c")]);

    expect(store.list()).toHaveLength(3);
    expect(store.get("a")?.status).toBe("completed");
    expect(store.get("b")?.status).toBe("running");
    expect(store.get("c")?.status).toBe("running");

    const reloaded = new StateStore(join(dir, "state.json"));
    expect(reloaded.list()).toHaveLength(3);
    expect(reloaded.get("a")?.status).toBe("completed");
  });

  it("upsertMany preserves sessions written by another process", () => {
    const path = join(dir, "state.json");
    const watcher = new StateStore(path);
    watcher.upsert(makeSession("a"));

    // Concurrent dispatch (separate process / StateStore instance).
    new StateStore(path).upsert(makeSession("b"));

    // Watch tick updates only A from stale in-memory view — must not drop B.
    watcher.upsertMany([{ ...makeSession("a"), status: "completed" }]);

    const onDisk = new StateStore(path).list().map((s) => s.id).sort();
    expect(onDisk).toEqual(["a", "b"]);
    expect(watcher.get("a")?.status).toBe("completed");
    expect(watcher.get("b")?.id).toBe("b");
  });

  it("upsert preserves sessions written by another process", () => {
    const path = join(dir, "state.json");
    const watcher = new StateStore(path);
    watcher.upsert(makeSession("a"));

    new StateStore(path).upsert(makeSession("b"));
    watcher.upsert({ ...makeSession("a"), status: "failed" });

    expect(new StateStore(path).list().map((s) => s.id).sort()).toEqual(["a", "b"]);
  });
});
