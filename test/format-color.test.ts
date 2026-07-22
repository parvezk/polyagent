import { describe, expect, it, vi } from "vitest";

vi.mock("picocolors", () => {
  const color = (code: number) => (value: string) => `\u001b[${code}m${value}\u001b[0m`;

  return {
    default: {
      bold: color(1),
      dim: color(2),
      inverse: color(7),
      red: color(31),
      green: color(32),
      yellow: color(33),
      blue: color(34),
      magenta: color(35),
      cyan: color(36),
      cyanBright: color(96),
    },
  };
});

import { renderTable, type StatusRow } from "../src/format.js";

const ANSI_ESCAPE = /\u001b\[[0-9;]*m/g;

describe("renderTable color output", () => {
  it("preserves the uncolored table's visible column alignment", () => {
    const rows: StatusRow[] = [
      {
        vendor: "jules",
        id: "short",
        label: "Fix",
        status: "running",
        lastUpdate: "just now",
      },
      {
        vendor: "claude",
        id: "a-much-longer-session-id",
        label: "Investigate alignment",
        status: "needs_review",
        lastUpdate: "12 min ago",
      },
    ];

    const plain = renderTable(rows);
    const colored = renderTable(rows, { color: true, tick: 0 });

    expect(colored).toContain("\u001b[");
    expect(colored.replace(ANSI_ESCAPE, "")).toBe(plain);
  });
});
