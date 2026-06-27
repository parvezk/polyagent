import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest } from "../types.js";
import type { GeminiPort } from "./gemini-port.js";
export declare class GeminiAdapter implements AgentAdapter {
    private readonly port;
    readonly vendor: AgentSession["vendor"];
    constructor(port: GeminiPort);
    dispatch(req: DispatchRequest): Promise<AgentSession>;
    getStatus(sessionId: string): Promise<AgentStatus>;
    getOutput(sessionId: string): Promise<AgentOutput>;
    sendFollowup(sessionId: string, message: string): Promise<void>;
}
