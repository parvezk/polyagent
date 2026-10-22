import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest } from "../types.js";
import type { ClaudePort } from "./claude-port.js";
export declare class ClaudeAdapter implements AgentAdapter {
    private readonly port;
    readonly vendor: "claude";
    constructor(port: ClaudePort);
    dispatch(req: DispatchRequest): Promise<AgentSession>;
    getStatus(sessionId: string): Promise<AgentStatus>;
    getOutput(sessionId: string): Promise<AgentOutput>;
    sendFollowup(sessionId: string, message: string): Promise<void>;
}
