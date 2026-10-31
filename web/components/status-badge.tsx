import { STATUS_STYLE, type SessionStatus } from "@/lib/view";

export function StatusBadge({ status }: { status: SessionStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.unknown;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap font-mono text-xs font-medium leading-4 ${s.className}`}
      title={status}
    >
      <span aria-hidden>{s.glyph}</span>
      {s.label}
    </span>
  );
}
