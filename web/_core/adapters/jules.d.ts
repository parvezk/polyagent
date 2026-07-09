import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest } from "../types.js";
import type { JulesPort } from "./jules-port.js";
export declare class JulesAdapter implements AgentAdapter {
  private readonly port;
  readonly vendor: "jules";
  constructor(port: JulesPort);
  dispatch(req: DispatchRequest): Promise<AgentSession>;
  getStatus(sessionId: string): Promise<AgentStatus>;
  getOutput(sessionId: string): Promise<AgentOutput>;
  sendFollowup(sessionId: string, message: string): Promise<void>;
}
