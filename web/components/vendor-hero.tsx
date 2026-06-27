import { VendorIcon, VENDOR_META, type VendorKey } from "@/components/vendor-icon";

const VENDORS: VendorKey[] = ["claude", "jules", "cursor", "gemini"];

// Compact panel between the top bar and the table — what PolyAgent is + which
// vendors you can orchestrate, visible the moment the site loads.
export function VendorHero() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
      <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">
        A vendor-agnostic control plane for cloud coding agents. Dispatch and track agents across
        vendors from <span className="text-zinc-100">one interface</span> — no tab-switching between
        vendor dashboards, no lock-in, no context switching.
      </p>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-xs uppercase tracking-wider text-zinc-600">Orchestrates</span>
        {VENDORS.map((v) => (
          <span key={v} className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
            <VendorIcon vendor={v} className="size-4" />
            {VENDOR_META[v].label}
          </span>
        ))}
      </div>
    </div>
  );
}
