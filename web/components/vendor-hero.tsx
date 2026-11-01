import { VendorMark } from "@/components/vendor-icon";
import { VENDORS } from "@/utils/constants";

// What PolyAgent is, and the vendors it drives, in one plain band under the header.
export function VendorHero() {
  return (
    <div className="space-y-3 border-b border-rule pb-6">
      <p className="max-w-[65ch] text-[15px] leading-[23px] text-ink">
        One place to dispatch coding agents from any vendor and review what they did. No switching
        between vendor dashboards, no lock-in.
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted">
          Orchestrates
        </span>
        {VENDORS.map((v) => (
          <VendorMark key={v} vendor={v} label />
        ))}
      </div>
    </div>
  );
}
