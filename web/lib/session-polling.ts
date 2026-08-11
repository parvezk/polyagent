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
  if (!currentData?.sessions) return SESSIONS_REFRESH_INTERVAL_MS;

  return currentData.sessions.every((session) => isTerminalSessionStatus(session.status))
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
