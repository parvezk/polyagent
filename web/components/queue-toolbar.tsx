"use client";

import { VendorMark } from "@/components/vendor-icon";
import { QUEUE_SORTS, type QueueSort, type QueueVendor } from "@/lib/queue";

interface QueueToolbarProps {
  vendors: { vendor: QueueVendor; count: number }[];
  selected: QueueVendor[];
  onVendorsChange: (v: QueueVendor[]) => void;
  sort: QueueSort;
  onSortChange: (s: QueueSort) => void;
}

const chip =
  "inline-flex h-8 items-center gap-1.5 rounded-[2px] border px-2 text-[13px] transition-colors";
const chipOn = "border-ink bg-ink text-on-ink";
const chipOff = "border-rule-strong bg-transparent text-ink hover:bg-paper-sunk";

export function QueueToolbar({
  vendors,
  selected,
  onVendorsChange,
  sort,
  onSortChange,
}: QueueToolbarProps) {
  const all = selected.length === 0;

  function toggle(v: QueueVendor) {
    onVendorsChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-rule py-2.5">
      <div
        role="group"
        aria-label="Filter by vendor"
        className="flex flex-wrap items-center gap-1.5"
      >
        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted">Vendor</span>
        <button
          type="button"
          aria-pressed={all}
          onClick={() => onVendorsChange([])}
          className={`${chip} ${all ? chipOn : chipOff}`}
        >
          All
        </button>
        {vendors.map(({ vendor, count }) => {
          const on = selected.includes(vendor);
          return (
            <button
              key={vendor}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(vendor)}
              className={`${chip} ${on ? chipOn : chipOff}`}
            >
              <VendorMark vendor={vendor} />
              <span className={`font-mono text-xs ${on ? "text-on-ink" : "text-ink-muted"}`}>{count}</span>
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted">
        Sort
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as QueueSort)}
          className="h-8 rounded-[2px] border border-rule-strong bg-paper-raised px-2 text-[13px] font-normal normal-case tracking-normal text-ink"
        >
          {QUEUE_SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
