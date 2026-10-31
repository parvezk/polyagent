// Stand-in logo until PolyAgent has one: "Poly" in ink, "Agent" in crimson.
export function Wordmark({ size = "md" }: { size?: "md" | "xl" }) {
  return (
    <span
      className={`font-bold tracking-[-0.01em] text-ink ${
        size === "xl" ? "text-[40px] leading-[44px]" : "text-lg leading-6"
      }`}
    >
      Poly<span className="text-crimson">Agent</span>
    </span>
  );
}
