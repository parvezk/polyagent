#!/usr/bin/env node
import { Command } from "commander";
import { dispatchCommand } from "./commands/dispatch.js";
import { dispatchWizard } from "./commands/dispatch-interactive.js";
import { statusCommand } from "./commands/status.js";
import { followupCommand } from "./commands/followup.js";
const program = new Command();
program.name("polyagent").description("Vendor-agnostic cloud coding agent dispatcher");
program
  .command("dispatch")
  .argument("[prompt]", "task for the agent (omit to launch the interactive wizard)")
  .option("--vendor <vendor>", "claude | jules")
  .option("--repo <owner/repo>", "GitHub repo (required for Jules)")
  .option("--branch <branch>", "starting branch")
  .option("--model <model>", "model id (Claude; prompts if omitted in a TTY)")
  .action((prompt, o) => {
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
      vendor: o.vendor,
      repo: o.repo,
      branch: o.branch,
      model: o.model,
    });
  });
program
  .command("status")
  .argument("[sessionId]", "show one session instead of all")
  .option("--watch", "live-refresh the table until Ctrl-C")
  .description("Unified live status of all dispatched sessions")
  .action((sessionId, o) => statusCommand(sessionId, { watch: o.watch }));
program
  .command("followup")
  .argument("<sessionId>", "session to message")
  .argument("<message>", "follow-up message")
  .description("Send a follow-up message to a running session")
  .action((sessionId, message) => followupCommand(sessionId, message));
program.parseAsync();
