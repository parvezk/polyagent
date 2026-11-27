# Founder account: design-to-development coordination, October 29, 2026

## Source
Direct message from Parvez in this chat on October 29. This is founder experience, not external customer validation. Read alongside `drafts-v5.md` and `writing-rules.md`. The newer shared MISSION records an approved track/understand/approve one-liner; this note does not replace it or select a new audience.

## What Parvez reported
Agent Teams, tmux/Ghostty and custom notifications helped inside development. Parvez still moved work manually from Google Flow, AI Studio and Midjourney into Claude Code and Cursor. He mentally tracked design and development separately across desktop apps, browser tabs and CLI sessions.

Returning the next day required reconstructing where work had stopped and which sessions needed which input. Token limits and session errors made this harder. Sometimes a long reply remained unsent because he forgot to press Enter in one of several Claude Code sessions. Reading long responses across sessions and Cursor was cognitively draining. After two or three days, he described feeling slightly burned out, alongside ordinary email, calendar and other tab switching. Treat this as his reported experience, not a medical claim or quantified productivity benchmark.

## Interpretation to test
The unresolved problem extends beyond dispatch: a person must preserve the relationship between a task, its design artifacts, agent sessions and pending decisions, including after interruptions. A session status alone cannot tell them everything needed to resume the project. The user is currently doing this reconstruction mentally.

Separate two candidate needs: carrying design intent and artifacts into development; and recovering a clear picture of ongoing work and pending human input. This account supports both as personal pain but does not yet establish which users will pay, how often it occurs elsewhere, or which should be built first.

The forgotten Enter incident is a reminder that not all stalled work is a model failure. A product cannot claim to detect an unsent message in an unrelated application without an appropriate integration and access.

## Product implications, proposed only
Keep the existing coding-agent core as the starting point. A useful review/continuation surface would answer what the task is, what changed since the person left, why it is paused, what input is needed, and which source artifact or session to open. Such a surface needs source links and enough detail to verify summaries. This is a candidate design, not a shipped feature or an approved implementation plan.

Do not claim current Google Flow, AI Studio or Midjourney integrations, automatic cross-tool context transfer, automatic recovery after context exhaustion, or visibility into arbitrary desktop/browser sessions. Current capabilities need separate runtime verification.

## Proposed application language, not approved
I used Agent Teams and tmux to manage parallel coding sessions, but I still moved design work from Flow, AI Studio and Midjourney into Claude Code and Cursor myself. When I came back the next day, I had to reconstruct where I had stopped and which sessions needed my input. Errors and context limits made that harder. I spent more time reading through sessions and keeping track of the work than I wanted to.

## Next question
For one real design-to-code handoff, what did Parvez transfer: an image or file, a link, written instructions, earlier decisions, or some combination? What had to be reconstructed when returning? This will help distinguish missing artifacts/context from missing status and attention cues. Do not ask him to repeat the general pain account.
