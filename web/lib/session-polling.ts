import type { SessionStatus } from "@/lib/view";

const SESSIONS_REFRESH_INTERVAL_MS = 3000;
const SESSION_DETAIL_REFRESH_INTERVAL_MS = 4000;

type SessionStatusLike = {
  status?: SessionStatus;
};

export function isTerminalSessionStatus(status: SessionStatus | undefined): boolean {
  return status === "completed" || status === "failed";
}

export function getSessionsRefreshInterval(
  currentData: { sessions?: SessionStatusLike[] } | undefined,
): number {
  const sessions = currentData?.sessions;
  // Keep polling when the list is missing or empty. `[].every(...)` is vacuously
  // true, and GET /api/sessions returns `{ sessions: [] }` on list failures — so
  // treating empty as "all terminal" permanently freezes the dashboard.
  if (!sessions || sessions.length === 0) return SESSIONS_REFRESH_INTERVAL_MS;

  return sessions.every((session) => isTerminalSessionStatus(session.status))
    ? 0
    : SESSIONS_REFRESH_INTERVAL_MS;
}

export function getSessionDetailRefreshInterval({
  initialStatus,
  refreshedStatus,
}: {
  initialStatus?: SessionStatus;
  refreshedStatus?: SessionStatus;
}): number {
  const status = refreshedStatus ?? initialStatus;

  return isTerminalSessionStatus(status) ? 0 : SESSION_DETAIL_REFRESH_INTERVAL_MS;
}
