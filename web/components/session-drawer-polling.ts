import type { SessionStatus } from "@/lib/core";

const RUNNING_REFRESH_INTERVAL_MS = 3000;

export function getSessionDrawerRefreshInterval(
  sessionStatus?: SessionStatus,
  detailStatus?: SessionStatus,
  isAwaitingFollowup = false,
) {
  if (isAwaitingFollowup && (!detailStatus || detailStatus === "needs_review")) {
    return RUNNING_REFRESH_INTERVAL_MS;
  }

  const currentStatus = detailStatus ?? sessionStatus;
  return currentStatus === "running" ? RUNNING_REFRESH_INTERVAL_MS : 0;
}

export function getSessionDrawerStatus(
  sessionStatus: SessionStatus,
  detailStatus?: SessionStatus,
  isAwaitingFollowup = false,
): SessionStatus {
  if (isAwaitingFollowup && (!detailStatus || detailStatus === "needs_review")) {
    return "running";
  }

  return detailStatus ?? sessionStatus;
}
