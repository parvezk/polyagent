export type CursorRunStatus = "running" | "finished" | "error" | "cancelled";
export interface CursorPort {
    createAgent(i: {
        prompt: string;
        repo: string;
        branch?: string;
        modelId?: string;
    }): Promise<{
        agentId: string;
        status: CursorRunStatus;
        prUrl?: string;
    }>;
    getLatestRunStatus(agentId: string): Promise<{
        status: CursorRunStatus;
        summary?: string;
        prUrl?: string;
    }>;
    sendFollowup(agentId: string, message: string): Promise<void>;
}
export declare function realCursorPort(apiKey: string): CursorPort;
