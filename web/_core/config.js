import { config as loadEnv } from "dotenv";
import { homedir } from "node:os";
import { join } from "node:path";
// Load keys from .env.local first (takes precedence), then .env as fallback.
// Side-effect on import so any entrypoint (CLI or smoke script) gets keys.
loadEnv({ path: [".env.local", ".env"] });
/** Where dispatched sessions are persisted. */
export const STATE_PATH = join(homedir(), ".polyagent", "state.json");
const ENV_VARS = {
  claude: "ANTHROPIC_API_KEY",
  jules: "JULES_API_KEY",
  cursor: "CURSOR_API_KEY",
  gemini: "GEMINI_API_KEY",
};
/** Resolve a vendor's API key from the environment, or throw a helpful error. */
export function resolveKey(vendor) {
  const key = process.env[ENV_VARS[vendor]];
  if (!key) {
    throw new Error(`No API key for ${vendor}. Set ${ENV_VARS[vendor]} in .env.local.`);
  }
  return key;
}
