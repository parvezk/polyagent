import type { SessionStatus } from "@/lib/view";

const SESSIONS_REFRESH_INTERVAL_MS = 3000;
const SESSION_DETAIL_REFRESH_INTERVAL_MS = 4000;

type SessionStatusLike = {
  status?: SessionStatus;
};

export function isTerminalSessionStatus(status: SessionStatus | undefined): boolean {
  return status === "completed" || status === "failed";
}

/**
 * Adapters catch vendor blips and return `unknown` instead of throwing.
 * Pollers must not persist that sentinel — otherwise a transient error
 * clobbers real states like `needs_review` / `running`.
 */
export function isPersistableLiveStatus(status: SessionStatus | undefined): boolean {
  return status !== undefined && status !== "unknown";
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
