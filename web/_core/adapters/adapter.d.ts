import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest, Vendor } from "../types.js";
export interface AgentAdapter {
    readonly vendor: Vendor;
    dispatch(req: DispatchRequest): Promise<AgentSession>;
    getStatus(sessionId: string): Promise<AgentStatus>;
    getOutput(sessionId: string): Promise<AgentOutput>;
    sendFollowup(sessionId: string, message: string): Promise<void>;
}
