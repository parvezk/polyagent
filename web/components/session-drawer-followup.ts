export function getDraftAfterFailedFollowup(currentDraft: string, failedMessage: string) {
  return currentDraft === "" ? failedMessage : currentDraft;
}
