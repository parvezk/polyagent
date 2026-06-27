#!/usr/bin/env node
import { Command } from "commander";
import { dispatchCommand } from "./commands/dispatch.js";
import { statusCommand } from "./commands/status.js";
import type { Vendor } from "./types.js";

const program = new Command();

program.name("polyagent").description("Vendor-agnostic cloud coding agent dispatcher");

program
  .command("dispatch")
  .argument("<prompt>", "task for the agent")
  .requiredOption("--vendor <vendor>", "claude | jules")
  .option("--repo <owner/repo>", "GitHub repo (required for Jules)")
  .option("--branch <branch>", "starting branch")
  .option("--model <model>", "model id (Claude; prompts if omitted in a TTY)")
  .action((prompt: string, o: { vendor: string; repo?: string; branch?: string; model?: string }) =>
    dispatchCommand(prompt, {
      vendor: o.vendor as Vendor,
      repo: o.repo,
      branch: o.branch,
      model: o.model,
    }),
  );

program
  .command("status")
  .argument("[sessionId]", "show one session instead of all")
  .description("Unified live status of all dispatched sessions")
  .action((sessionId?: string) => statusCommand(sessionId));

program.parseAsync();
