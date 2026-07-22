import type { Vendor } from "./types.js";
import type { AgentAdapter } from "./adapters/adapter.js";
import { resolveKey } from "./config.js";
import { ClaudeAdapter } from "./adapters/claude.js";
import { realClaudePort } from "./adapters/claude-port.js";
import { JulesAdapter } from "./adapters/jules.js";
import { realJulesPort } from "./adapters/jules-port.js";
import { CursorAdapter } from "./adapters/cursor.js";
import { realCursorPort } from "./adapters/cursor-port.js";
import { GeminiAdapter } from "./adapters/gemini.js";
import { realGeminiPort } from "./adapters/gemini-port.js";
import { fakeAdapter } from "./adapters/fake.js";

/** Build a live adapter for a vendor, wired to its real port + resolved key. */
export function buildAdapter(vendor: Vendor): AgentAdapter {
  // Test seam: the smoke/E2E layer sets POLYAGENT_FAKE_ADAPTERS so the CLI runs
  // end-to-end without vendor keys or network calls. Never set in production.
  if (process.env.POLYAGENT_FAKE_ADAPTERS) return fakeAdapter(vendor);

  const key = resolveKey(vendor);
  switch (vendor) {
    case "claude":
      return new ClaudeAdapter(realClaudePort(key));
    case "jules":
      return new JulesAdapter(realJulesPort(key));
    case "cursor":
      return new CursorAdapter(realCursorPort(key));
    case "gemini":
      return new GeminiAdapter(realGeminiPort(key));
  }
}
