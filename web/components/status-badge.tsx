import { STATUS_STYLE, type SessionStatus } from "@/lib/view";

export function StatusBadge({ status }: { status: SessionStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.unknown;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}
      title={status}
    >
      <span className={`size-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
