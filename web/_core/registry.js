import { resolveKey } from "./config.js";
import { ClaudeAdapter } from "./adapters/claude.js";
import { realClaudePort } from "./adapters/claude-port.js";
import { JulesAdapter } from "./adapters/jules.js";
import { realJulesPort } from "./adapters/jules-port.js";
import { CursorAdapter } from "./adapters/cursor.js";
import { realCursorPort } from "./adapters/cursor-port.js";
import { GeminiAdapter } from "./adapters/gemini.js";
import { realGeminiPort } from "./adapters/gemini-port.js";
/** Build a live adapter for a vendor, wired to its real port + resolved key. */
export function buildAdapter(vendor) {
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
