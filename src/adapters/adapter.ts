import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest, Vendor } from "../types.js";

export interface AgentAdapter {
  readonly vendor: Vendor;

  // Start a new agent session. Returns the created session (with vendor-native ID).
  dispatch(req: DispatchRequest): Promise<AgentSession>;

  // Current status of a single session.
  getStatus(sessionId: string): Promise<AgentStatus>;

  // Conversation / output history.
  getOutput(sessionId: string): Promise<AgentOutput>;

  // Send a follow-up message to a running session. Present in the contract;
  // wired to a CLI command in V3, not V1.
  sendFollowup(sessionId: string, message: string): Promise<void>;
}
