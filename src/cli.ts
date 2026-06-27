#!/usr/bin/env node
import { Command } from "commander";
import { dispatchCommand } from "./commands/dispatch.js";
import { dispatchWizard } from "./commands/dispatch-interactive.js";
import { statusCommand } from "./commands/status.js";
import { followupCommand } from "./commands/followup.js";
import type { Vendor } from "./types.js";

const program = new Command();

program.name("polyagent").description("Vendor-agnostic cloud coding agent dispatcher");

program
  .command("dispatch")
  .argument("[prompt]", "task for the agent (omit to launch the interactive wizard)")
  .option("--vendor <vendor>", "claude | jules")
  .option("--repo <owner/repo>", "GitHub repo (required for Jules)")
  .option("--branch <branch>", "starting branch")
  .option("--model <model>", "model id (Claude; prompts if omitted in a TTY)")
  .action(
    (
      prompt: string | undefined,
      o: { vendor?: string; repo?: string; branch?: string; model?: string },
    ) => {
      // No prompt → interactive wizard. With a prompt → flag-driven (scriptable).
      if (!prompt) return dispatchWizard();
      if (!o.vendor) {
        console.error(
          "--vendor is required when a prompt is given (or omit the prompt for the wizard).",
        );
        process.exitCode = 1;
        return;
      }
      return dispatchCommand(prompt, {
        vendor: o.vendor as Vendor,
        repo: o.repo,
        branch: o.branch,
        model: o.model,
      });
    },
  );

program
  .command("status")
  .argument("[sessionId]", "show one session instead of all")
  .option("--watch", "live-refresh the table until Ctrl-C")
  .description("Unified live status of all dispatched sessions")
  .action((sessionId: string | undefined, o: { watch?: boolean }) =>
    statusCommand(sessionId, { watch: o.watch }),
  );

program
  .command("followup")
  .argument("<sessionId>", "session to message")
  .argument("<message>", "follow-up message")
  .description("Send a follow-up message to a running session")
  .action((sessionId: string, message: string) => followupCommand(sessionId, message));

program.parseAsync();
