import pc from "picocolors";
export function relativeTime(d) {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1)
        return "just now";
    if (mins < 60)
        return `${mins} min ago`;
    return `${Math.floor(mins / 60)} hr ago`;
}
/** Truncate to max visible chars, adding an ellipsis. */
export function truncate(s, max) {
    return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
/**
 * Color/emphasize a status token by meaning. `tick` (even/odd) drives a pulse
 * on `running` — the color alternates each refresh, giving a "live" blink
 * without changing the string width (so column alignment is preserved).
 */
export function colorStatus(status, tick = 0) {
    switch (status) {
        case "running":
            return pc.bold(tick % 2 === 0 ? pc.cyan(status) : pc.cyanBright(status));
        case "needs_review":
            return pc.bold(pc.inverse(pc.yellow(status))); // highlighted bar — needs you
        case "completed":
            return pc.bold(pc.green(status));
        case "failed":
            return pc.bold(pc.red(status));
        default:
            return pc.dim(status);
    }
}
const COLUMNS = [
    { header: "VENDOR", key: "vendor" },
    { header: "SESSION", key: "id" },
    { header: "LABEL", key: "label" },
    { header: "STATUS", key: "status" },
    { header: "LAST UPDATE", key: "lastUpdate" },
];
const SEP = "   ";
/**
 * Render rows as a fixed-width, column-aligned table (header + one line per row).
 * Widths are computed on plain text; color is applied AFTER padding so alignment
 * is never thrown off by invisible ANSI codes.
 */
const VENDOR_COLOR = {
    claude: (s) => pc.bold(pc.magenta(s)),
    jules: (s) => pc.bold(pc.blue(s)),
};
export function renderTable(rows, opts = {}) {
    const matrix = [COLUMNS.map((c) => c.header), ...rows.map((r) => COLUMNS.map((c) => r[c.key]))];
    const widths = COLUMNS.map((_, col) => Math.max(...matrix.map((line) => line[col].length)));
    return matrix
        .map((line, rowIdx) => line
        .map((cell, col) => {
        const padded = cell.padEnd(widths[col]);
        if (!opts.color)
            return padded;
        const key = COLUMNS[col].key;
        if (rowIdx === 0)
            return pc.bold(pc.dim(padded)); // header row
        // Color the token, then re-pad so the colored cell keeps its width.
        if (key === "status") {
            return colorStatus(cell, opts.tick) + " ".repeat(widths[col] - cell.length);
        }
        if (key === "vendor") {
            const fn = VENDOR_COLOR[cell] ?? ((s) => s);
            return fn(cell) + " ".repeat(widths[col] - cell.length);
        }
        if (key === "label")
            return pc.dim(padded);
        return padded;
    })
        .join(SEP))
        .join("\n");
}
