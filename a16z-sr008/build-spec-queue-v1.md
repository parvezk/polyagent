# Build spec: PolyAgent "Queue" screen for the SR008 video

Written Oct 30, 2026 for a separate build session. Parvez approved building this so he can record a 60s video with a 20s screen share by Sat Oct 31 at the latest. Application drafts: drafts-v6.md. Writing rules for any UI copy: writing-rules.md.

## Goal
One new screen in the web dashboard (web/, Next.js) that shows every agent run from every vendor in one queue, sorted by what needs the human. It must work on real sessions and look clean enough to film. Target: deployed by Fri Oct 30, 9pm ET.

The product line it has to show: "Agents from any vendor work on your repos. One queue shows you what's waiting and what each agent changed, so you can answer, approve or stop it."

## What already exists (reuse, don't rebuild)
- `src/types.ts`: `SessionStatus = running | needs_review | completed | failed | unknown`; `AgentStatus` has `needsInput`, `summary`; `AgentOutput.messages`.
- `AgentAdapter`: dispatch / getStatus / getOutput / sendFollowup for claude, jules, cursor, gemini (`src/registry.ts`, vendored to `web/_core` via `npm run sync-core`).
- Web: Supabase `sessions` table (RLS by user), routes under `web/app/api/sessions`, follow-up route, dispatch route.

## Must have
1. Route `/queue` (or make it the dashboard home if that is simpler), grouped in this order:
   - Waiting on you: `needsInput` true or status `needs_review`
   - Ready to review: `completed` with an `outputUrl` (PR or session link)
   - Running
   - Failed
2. Each item shows: vendor badge, repo (if any), task label, time since last update, and the agent's latest message or question (last `agent` message from getOutput, trimmed to 2 lines).
3. Actions on each item: Reply (uses the existing follow-up route), Open (outputUrl in a new tab), Dismiss (hide from queue; store a flag on the session row).
4. Counts per group in the header. Refresh button plus polling every 30s.
5. Works with at least two vendors live (Claude and Cursor or Gemini). Jules is shutting down Dec 31, 2026; keep the adapter, add nothing Jules-specific, and do not feature it in the demo.

## Stretch (only after must-haves ship)
- "What changed" line per finished item: one or two plain sentences generated from the agent's last messages with the Anthropic API, cached on the session row, labelled "summary". If this is flaky, cut it.

## Out of scope
New vendors, swarm visualizations, auth changes, landing page, pricing.

## Rules
- Work on a branch in parvezk/polyagent and open a draft PR. Parvez merges and deploys. No direct pushes to main.
- Tests for the grouping logic with fakes, like the existing adapter tests. Keep `npm test` green.
- Demo data must be real runs. A fixture mode is fine for local dev only and must never show on the deployed site.
- UI copy follows writing-rules.md. Short labels, no marketing words.

## Suggested split (if running parallel workers)
1. Queue data: a server route that loads the user's sessions, refreshes status via adapters, and returns grouped items.
2. Queue UI: page, cards, actions, empty states.
3. Tests, sync-core, and a short recording checklist for Parvez (which sessions to dispatch beforehand so the queue has something in every group).
