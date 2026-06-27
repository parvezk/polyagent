export type JulesState = "QUEUED" | "PLANNING" | "AWAITING_PLAN_APPROVAL" | "AWAITING_USER_FEEDBACK" | "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "FAILED";
export interface JulesPort {
    createSession(i: {
        prompt: string;
        repo?: string;
        branch?: string;
        title?: string;
    }): Promise<{
        sessionId: string;
        state: JulesState;
    }>;
    getSession(sessionId: string): Promise<{
        state: JulesState;
        lastMessage?: string;
    }>;
    listActivities(sessionId: string): Promise<{
        messages: {
            role: "agent" | "human";
            content: string;
            timestamp: string;
        }[];
    }>;
    sendMessage(sessionId: string, message: string): Promise<void>;
    /** List GitHub repos registered as Jules sources. Optional (used by the CLI wizard). */
    listSources?(): Promise<{
        repo: string;
        defaultBranch?: string;
    }[]>;
}
export declare function realJulesPort(apiKey: string): JulesPort;
