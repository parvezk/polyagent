import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest } from "../types.js";
import type { CursorPort } from "./cursor-port.js";
export declare class CursorAdapter implements AgentAdapter {
  private readonly port;
  readonly vendor: "cursor";
  constructor(port: CursorPort);
  dispatch(req: DispatchRequest): Promise<AgentSession>;
  getStatus(sessionId: string): Promise<AgentStatus>;
  getOutput(sessionId: string): Promise<AgentOutput>;
  sendFollowup(sessionId: string, message: string): Promise<void>;
}
