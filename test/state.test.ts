import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { StateStore } from "../src/state.js";
import type { AgentSession } from "../src/types.js";

function makeSession(id: string): AgentSession {
  return { id, vendor: "claude", status: "running", dispatchedAt: "2026-06-23T00:00:00Z" };
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
});
