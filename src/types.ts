export type Vendor = "claude" | "jules" | "cursor" | "gemini";

export type SessionStatus = "running" | "needs_review" | "completed" | "failed" | "unknown";

export interface AgentSession {
  id: string; // vendor-native session ID
  vendor: Vendor;
  label?: string; // first line of the prompt, truncated
  status: SessionStatus;
  dispatchedAt: string; // ISO
  lastPolled?: string; // ISO
  outputUrl?: string; // PR/branch (Jules) OR session URL (Claude) — generic, NOT assumed to be a PR
  firstMessage?: string; // first agent response captured at dispatch (Claude); undefined for async vendors (Jules)
}

export interface AgentStatus {
  status: SessionStatus;
  lastUpdate: Date;
  summary?: string;
  needsInput: boolean;
}

export interface AgentOutput {
  sessionId: string;
  vendor: Vendor;
  messages: { role: "agent" | "human"; content: string; timestamp: Date }[];
}

export interface DispatchRequest {
  prompt: string;
  repo?: string; // "owner/repo" — used by Jules
  branch?: string;
  model?: string;
}
