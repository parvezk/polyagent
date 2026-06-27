export function relativeTime(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)} hr ago`;
}

export interface StatusRow {
  vendor: string;
  id: string;
  label: string;
  status: string;
  lastUpdate: string;
}

const COLUMNS: { header: string; key: keyof StatusRow }[] = [
  { header: "VENDOR", key: "vendor" },
  { header: "SESSION", key: "id" },
  { header: "LABEL", key: "label" },
  { header: "STATUS", key: "status" },
  { header: "LAST UPDATE", key: "lastUpdate" },
];

const SEP = "   ";

/** Render rows as a fixed-width, column-aligned table (header + one line per row). */
export function renderTable(rows: StatusRow[]): string {
  const matrix = [COLUMNS.map((c) => c.header), ...rows.map((r) => COLUMNS.map((c) => r[c.key]))];
  const widths = COLUMNS.map((_, col) => Math.max(...matrix.map((line) => line[col].length)));
  // Pad every cell (including the last) so all lines share the same width.
  return matrix
    .map((line) => line.map((cell, col) => cell.padEnd(widths[col])).join(SEP))
    .join("\n");
}
