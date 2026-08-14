import type { AgentSession } from "./types.js";
export declare class StateStore {
    private readonly path;
    private sessions;
    constructor(path: string);
    load(): void;
    save(): void;
    upsert(session: AgentSession): void;
    upsertMany(sessions: AgentSession[]): void;
    list(): AgentSession[];
    get(id: string): AgentSession | undefined;
    /** Replace a session's vendor-native id (e.g. Gemini follow-up minting a new interaction). */
    rekey(oldId: string, next: AgentSession): void;
}
