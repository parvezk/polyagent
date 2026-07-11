export type Vendor = "claude" | "jules" | "cursor" | "gemini";
export type SessionStatus = "running" | "needs_review" | "completed" | "failed" | "unknown";
export interface AgentSession {
    id: string;
    vendor: Vendor;
    label?: string;
    status: SessionStatus;
    dispatchedAt: string;
    lastPolled?: string;
    outputUrl?: string;
    firstMessage?: string;
}
export interface AgentStatus {
    status: SessionStatus;
    lastUpdate: Date;
    summary?: string;
    needsInput: boolean;
}
export interface AgentOutput {
    sessionId: string;
    vendor: Vendor;
    messages: {
        role: "agent" | "human";
        content: string;
        timestamp: Date;
    }[];
}
export interface DispatchRequest {
    prompt: string;
    repo?: string;
    branch?: string;
    model?: string;
}
