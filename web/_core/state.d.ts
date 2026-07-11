import type { AgentSession } from "./types.js";
export declare class StateStore {
    private readonly path;
    private sessions;
    constructor(path: string);
    load(): void;
    save(): void;
    upsert(session: AgentSession): void;
    list(): AgentSession[];
    get(id: string): AgentSession | undefined;
}
