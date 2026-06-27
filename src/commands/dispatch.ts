import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { buildAdapter } from "../registry.js";
import { StateStore } from "../state.js";
import { STATE_PATH } from "../config.js";
import { DEFAULT_CLAUDE_MODEL } from "../constants/claude.js";
import type { Vendor } from "../types.js";

export interface DispatchOptions {
  vendor: Vendor;
  repo?: string;
  branch?: string;
  model?: string;
}

/**
 * Decide which model to run. Precedence: explicit --model > interactive prompt
 * (Claude only, when a TTY is attached) > vendor default. Jules selects its own
 * model, so no prompt there.
 */
async function resolveModel(opts: DispatchOptions): Promise<string | undefined> {
  if (opts.model) return opts.model;
  if (opts.vendor !== "claude") return undefined;
  if (!stdin.isTTY) return DEFAULT_CLAUDE_MODEL; // non-interactive (smoke/CI)
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question(`Model for Claude [${DEFAULT_CLAUDE_MODEL}]: `)).trim();
  rl.close();
  return answer || DEFAULT_CLAUDE_MODEL;
}

export async function dispatchCommand(prompt: string, opts: DispatchOptions): Promise<void> {
  if (opts.vendor === "jules" && !opts.repo) {
    console.error('Jules needs a repo: polyagent dispatch --vendor jules --repo owner/repo "..."');
    process.exitCode = 1;
    return;
  }

  const model = await resolveModel(opts);
  const adapter = buildAdapter(opts.vendor);
  const session = await adapter.dispatch({
    prompt,
    repo: opts.repo,
    branch: opts.branch,
    model,
  });

  new StateStore(STATE_PATH).upsert(session);

  console.log(`Dispatched ${session.vendor} session ${session.id} (${session.status})`);
  console.log(`  label: ${session.label}`);
  if (session.outputUrl) console.log(`  output: ${session.outputUrl}`);
  if (session.firstMessage) console.log(`  first reply: ${session.firstMessage}`);
}
