// Bridge to the PolyAgent core (the same adapters/registry the CLI uses).
// Imports the VENDORED compiled core from web/_core so the web app is
// self-contained (deployable to Vercel, which can't reach ../../dist).
//
// After editing the core (repo src/), run `npm run sync-core` from web/ to refresh.
//
// SERVER-ONLY: pulls in vendor SDKs + reads API keys. Never import in a client component.
export { buildAdapter } from "../_core/registry.js";
export { StateStore } from "../_core/state.js";
export { STATE_PATH, resolveKey } from "../_core/config.js";
export { realJulesPort } from "../_core/adapters/jules-port.js";
export { DEFAULT_CLAUDE_MODEL } from "../_core/constants/claude.js";
export type {
  Vendor,
  SessionStatus,
  AgentSession,
  AgentStatus,
  AgentOutput,
  DispatchRequest,
} from "../_core/types.js";
