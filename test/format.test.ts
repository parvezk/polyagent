import { describe, it, expect } from "vitest";
import { relativeTime, renderTable } from "../src/format.js";

describe("relativeTime", () => {
  it("renders 'just now' under a minute", () => {
    expect(relativeTime(new Date(Date.now() - 5 * 1000))).toBe("just now");
  });

  it("renders minutes ago", () => {
    expect(relativeTime(new Date(Date.now() - 2 * 60 * 1000))).toBe("2 min ago");
  });

  it("renders hours ago", () => {
    expect(relativeTime(new Date(Date.now() - 3 * 60 * 60 * 1000))).toBe("3 hr ago");
  });
});

describe("renderTable", () => {
  it("includes headers and row cells", () => {
    const out = renderTable([
      {
        vendor: "claude",
        id: "sesn_1",
        label: "Fix bug",
        status: "needs_review",
        lastUpdate: "2 min ago",
      },
    ]);
    expect(out).toContain("VENDOR");
    expect(out).toContain("claude");
    expect(out).toContain("needs_review");
    expect(out).toContain("2 min ago");
  });

  it("aligns columns to the widest cell", () => {
    const out = renderTable([
      { vendor: "jules", id: "x", label: "short", status: "running", lastUpdate: "1 min ago" },
      {
        vendor: "claude",
        id: "a-much-longer-session-id",
        label: "longer label here",
        status: "completed",
        lastUpdate: "5 hr ago",
      },
    ]);
    const lines = out.split("\n");
    // every line padded to the same visible width (header + 2 rows = 3 lines)
    expect(lines).toHaveLength(3);
    const widths = new Set(lines.map((l) => l.length));
    expect(widths.size).toBe(1);
  });

  it("handles large row counts without overflowing the call stack", () => {
    const rows = Array.from({ length: 150_000 }, (_, index) => ({
      vendor: "jules",
      id: index === 149_999 ? "x".repeat(30) : "x",
      label: "label",
      status: "running",
      lastUpdate: "now",
    }));

    const lines = renderTable(rows).split("\n");

    expect(lines).toHaveLength(150_001);
    expect(new Set(lines.map((line) => line.length)).size).toBe(1);
  });
});
