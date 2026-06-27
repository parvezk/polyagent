export type ClaudeSessionStatus = "idle" | "running" | "rescheduling" | "terminated";
export interface ClaudePort {
    createSession(i: {
        prompt: string;
        modelId?: string;
    }): Promise<{
        sessionId: string;
        firstReply: string;
        status: ClaudeSessionStatus;
    }>;
    getStatus(sessionId: string): Promise<{
        status: ClaudeSessionStatus;
        summary?: string;
    }>;
    /** V3: send a follow-up message to a running session. Implemented but not exercised by unit tests. */
    sendEvent(sessionId: string, message: string): Promise<void>;
}
export declare function realClaudePort(apiKey: string): ClaudePort;
