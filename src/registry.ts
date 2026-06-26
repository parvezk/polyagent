import type { Vendor } from "./types.js";
import type { AgentAdapter } from "./adapters/adapter.js";
import { resolveKey } from "./config.js";
import { ClaudeAdapter } from "./adapters/claude.js";
import { realClaudePort } from "./adapters/claude-port.js";
import { JulesAdapter } from "./adapters/jules.js";
import { realJulesPort } from "./adapters/jules-port.js";

/** Build a live adapter for a vendor, wired to its real port + resolved key. */
export function buildAdapter(vendor: Vendor): AgentAdapter {
  const key = resolveKey(vendor);
  switch (vendor) {
    case "claude":
      return new ClaudeAdapter(realClaudePort(key));
    case "jules":
      return new JulesAdapter(realJulesPort(key));
  }
}
