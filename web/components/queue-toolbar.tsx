"use client";

import { VendorIcon, VENDOR_META } from "@/components/vendor-icon";
import { QUEUE_SORTS, type QueueSort, type QueueVendor } from "@/lib/queue";

interface QueueToolbarProps {
  vendors: { vendor: QueueVendor; count: number }[];
  selected: QueueVendor[];
  onVendorsChange: (v: QueueVendor[]) => void;
  sort: QueueSort;
  onSortChange: (s: QueueSort) => void;
}

const chip =
  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500";
const chipOn = "border-zinc-600 bg-zinc-800 text-zinc-50";
const chipOff =
  "border-zinc-800 bg-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-200";

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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
      <div
        role="group"
        aria-label="Filter by vendor"
        className="flex flex-wrap items-center gap-1.5"
      >
        <span className="mr-1 text-xs text-zinc-500">Vendor</span>
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
              <VendorIcon vendor={vendor} className="size-3.5" />
              {VENDOR_META[vendor]?.label ?? vendor}
              <span className="font-mono text-xs text-zinc-500">{count}</span>
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-500">
        Sort
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as QueueSort)}
          className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-[13px] text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
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
