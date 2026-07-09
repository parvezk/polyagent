export declare function relativeTime(d: Date): string;
/** Truncate to max visible chars, adding an ellipsis. */
export declare function truncate(s: string, max: number): string;
/**
 * Color/emphasize a status token by meaning. `tick` (even/odd) drives a pulse
 * on `running` — the color alternates each refresh, giving a "live" blink
 * without changing the string width (so column alignment is preserved).
 */
export declare function colorStatus(status: string, tick?: number): string;
export interface StatusRow {
  vendor: string;
  id: string;
  label: string;
  status: string;
  lastUpdate: string;
}
export declare function renderTable(
  rows: StatusRow[],
  opts?: {
    color?: boolean;
    tick?: number;
  },
): string;
