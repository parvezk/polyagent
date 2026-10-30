import { describe, it, expect } from "vitest";
import {
  groupFor,
  groupQueue,
  countQueue,
  repoFromUrl,
  lastAgentMessage,
  type QueueItem,
} from "../web/lib/queue";

function item(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "s1",
    vendor: "claude",
    label: "Task",
    status: "running",
    dispatchedAt: "2026-10-30T00:00:00.000Z",
    lastUpdate: "2026-10-30T00:00:00.000Z",
    group: "running",
    needsInput: false,
    ...overrides,
  };
}

describe("groupFor", () => {
  it("puts anything that needs input in waiting, even if running", () => {
    expect(groupFor({ status: "running", needsInput: true })).toBe("waiting");
    expect(groupFor({ status: "needs_review" })).toBe("waiting");
  });
  it("maps finished, failed and in-flight runs", () => {
    expect(groupFor({ status: "completed" })).toBe("review");
    expect(groupFor({ status: "failed" })).toBe("failed");
    expect(groupFor({ status: "running" })).toBe("running");
    expect(groupFor({ status: "unknown" })).toBe("running");
  });
});

describe("groupQueue / countQueue", () => {
  it("groups items and sorts each group by most recent update", () => {
    const items = [
      item({ id: "a", group: "review", lastUpdate: "2026-10-30T01:00:00.000Z" }),
      item({ id: "b", group: "review", lastUpdate: "2026-10-30T03:00:00.000Z" }),
      item({ id: "c", group: "waiting" }),
      item({ id: "d", group: "failed" }),
    ];
    const g = groupQueue(items);
    expect(g.review.map((i) => i.id)).toEqual(["b", "a"]);
    expect(g.waiting.map((i) => i.id)).toEqual(["c"]);
    expect(g.running).toEqual([]);
    expect(countQueue(items)).toEqual({ waiting: 1, review: 2, running: 0, failed: 1 });
  });
});

describe("repoFromUrl", () => {
  it("reads owner/repo from GitHub repo and PR links", () => {
    expect(repoFromUrl("https://github.com/parvezk/polyagent")).toBe("parvezk/polyagent");
    expect(repoFromUrl("https://github.com/parvezk/polyagent/pull/12")).toBe("parvezk/polyagent");
    expect(repoFromUrl("https://github.com/o/r.git")).toBe("o/r");
  });
  it("returns undefined for other links", () => {
    expect(repoFromUrl("https://cursor.com/agents/abc")).toBeUndefined();
    expect(repoFromUrl(undefined)).toBeUndefined();
  });
});

describe("lastAgentMessage", () => {
  it("returns the latest non-empty agent message", () => {
    expect(
      lastAgentMessage([
        { role: "agent", content: "first" },
        { role: "agent", content: "Which branch should I use?" },
        { role: "agent", content: "   " },
        { role: "human", content: "reply" },
      ]),
    ).toBe("Which branch should I use?");
  });
  it("returns undefined when there is none", () => {
    expect(lastAgentMessage([{ role: "human", content: "hi" }])).toBeUndefined();
    expect(lastAgentMessage(undefined)).toBeUndefined();
  });
});
