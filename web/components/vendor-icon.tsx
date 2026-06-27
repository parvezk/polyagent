// Cohesive vendor mark set. Brand-colored geometric glyphs (swap in exact brand
// SVGs later). Covers active vendors (claude, jules) + planned (cursor, gemini).

export type VendorKey = "claude" | "jules" | "cursor" | "gemini";

export const VENDOR_META: Record<VendorKey, { label: string; color: string; hint: string }> = {
  claude: { label: "Claude", color: "#D97757", hint: "managed agent · general sandbox" },
  jules: { label: "Jules", color: "#6E56CF", hint: "async · repo → PR" },
  cursor: { label: "Cursor", color: "#E4E4E7", hint: "cloud agent · repo → PR" },
  gemini: { label: "Gemini", color: "#3B82F6", hint: "Antigravity · sandbox" },
};

export function VendorIcon({ vendor, className = "size-4" }: { vendor: string; className?: string }) {
  const color = VENDOR_META[vendor as VendorKey]?.color ?? "#A1A1AA";

  switch (vendor) {
    case "claude":
      // Anthropic-style radial burst.
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g stroke={color} strokeWidth="2" strokeLinecap="round">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * Math.PI) / 6;
              return (
                <line
                  key={i}
                  x1={12 + Math.cos(a) * 3}
                  y1={12 + Math.sin(a) * 3}
                  x2={12 + Math.cos(a) * 9}
                  y2={12 + Math.sin(a) * 9}
                />
              );
            })}
          </g>
        </svg>
      );
    case "gemini":
      // Gemini 4-point spark.
      return (
        <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden>
          <path d="M12 2c0 5 5 10 10 10-5 0-10 5-10 10 0-5-5-10-10-10 5 0 10-5 10-10Z" />
        </svg>
      );
    case "jules":
      // Gem / diamond.
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
          <path d="M2 9h20M9 3l3 18M15 3l-3 18" strokeWidth="1.2" />
        </svg>
      );
    case "cursor":
      // Angular cursor cube.
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
          <path d="m3 7 9 5 9-5M12 12v10" strokeWidth="1.2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden>
          <circle cx="12" cy="12" r="5" />
        </svg>
      );
  }
}
