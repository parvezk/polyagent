export function normalizeSessionStatus(vendorStatus) {
    switch (vendorStatus) {
        case "running": // claude, cursor
        case "rescheduling": // claude
        case "in_progress": // gemini
        case "QUEUED": // jules
        case "PLANNING": // jules
        case "IN_PROGRESS": // jules
        case "PAUSED": // jules
            return "running";
        case "idle": // claude
        case "requires_action": // gemini
        case "AWAITING_PLAN_APPROVAL": // jules
        case "AWAITING_USER_FEEDBACK": // jules
            return "needs_review";
        case "terminated": // claude
        case "finished": // cursor
        case "completed": // gemini
        case "COMPLETED": // jules
            return "completed";
        case "error": // cursor
        case "cancelled": // cursor, gemini
        case "failed": // gemini
        case "FAILED": // jules
            return "failed";
        default:
            return "unknown";
    }
}
