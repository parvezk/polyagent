// Bridge to the PolyAgent core (the same adapters/registry the CLI uses).
// Imports the compiled core from ../../dist so the web app reuses the exact
// vendor logic. Rebuild core with `npm run build` at the repo root after core edits.
//
// SERVER-ONLY: this pulls in vendor SDKs + reads API keys. Never import from a
// client component.
export { buildAdapter } from "../../dist/registry.js";
export { StateStore } from "../../dist/state.js";
export { STATE_PATH, resolveKey } from "../../dist/config.js";
export { realJulesPort } from "../../dist/adapters/jules-port.js";
export { DEFAULT_CLAUDE_MODEL } from "../../dist/constants/claude.js";
export type {
  Vendor,
  SessionStatus,
  AgentSession,
  AgentStatus,
  AgentOutput,
  DispatchRequest,
} from "../../dist/types.js";
