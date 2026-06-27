import { STATUS_STYLE, type SessionStatus } from "@/lib/view";

export function StatusBadge({ status }: { status: SessionStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.unknown;

  // needs_review is the loudest element: filled gold pill with a glow.
  if (status === "needs_review") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-md bg-amber-400/15 px-2 py-0.5 font-mono text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40 shadow-[0_0_12px_-2px_rgba(251,191,36,0.55)]"
      >
        <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
        needs review
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${s.text}`} title={status}>
      <span className={`size-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
