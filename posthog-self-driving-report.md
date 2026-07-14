# PostHog Self-driving Setup Report

_Generated 2026-07-14 for project **PolyAgent** (PostHog project 500869)_

## Summary

PostHog Self-driving has been configured for PolyAgent. Session Replay, Error Tracking, and Support signal sources are now wired to the inbox, along with GitHub Issues (parvezk/polyagent) and Linear. Three scouts are active: `general`, `ai-observability`, and `web-analytics`. Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/500869/inbox) within ~30 minutes.

---

## AI Data Processing

**Status:** Approved — the organization-level AI data processing consent was granted before this run started.

---

## GitHub

**Status:** Connected during this run — integration id 185314, account `parvezk`.

The GitHub App now has access to all `parvezk` repositories. Self-driving will use this to research findings in code and open fixes.

---

## Products Enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | Enabled (inferred already on — recordings found in last 30 days) | `posthog.init` in `web/instrumentation-client.ts` is clean — no `disable_session_recording` override |
| Error Tracking | Enabled (server flip applied) | `posthog.init` has no `capture_exceptions: false` override; no active issues yet — sources armed for when errors arrive |
| Support (Conversations) | Enabled (server flip applied) | **Requires a follow-up:** tickets only flow once an inbound channel (email / inbox / Slack) is connected in PostHog settings |

> Note: `products-enable` API was unavailable in the current MCP version. Server flips for Error Tracking and Support should be verified manually at [project settings](https://us.posthog.com/project/500869/settings) if issues are not appearing.

---

## Signal Sources

| source_product | source_type | Action | Notes |
|---|---|---|---|
| `signals_scout` | `cross_source_issue` | Already on (default) | Scout gate is on by default — no row needed |
| `error_tracking` | `issue_created` | Enabled (id: 019f612d-0c89-…) | |
| `error_tracking` | `issue_reopened` | Enabled (id: 019f612d-11f4-…) | |
| `error_tracking` | `issue_spiking` | Enabled (id: 019f612d-13a7-…) | |
| `session_replay` | `session_analysis_cluster` | Enabled (id: 019f612d-179b-…) | Default 10% sample rate |
| `conversations` | `ticket` | Enabled (id: 019f612d-19db-…) | Dormant until inbound channel connected |
| `github` | `issue` | Enabled (id: 019f612f-4822-…) | |
| `linear` | `issue` | Enabled (id: 019f612f-4ae6-…) | |

---

## Connected Tools

| Tool | Status |
|---|---|
| GitHub Issues | **Connected by this setup** — warehouse source id `019f612f-2288-…`, repo `parvezk/polyagent`, first sync started. Only the `issues` table is syncing; more tables can be enabled in the UI at [data sources](https://us.posthog.com/project/500869/data-management/sources). |
| Linear | **Connected by this setup** — warehouse source id `019f612f-3064-…` (workspace: PK-HQ), first sync running. Only the `issues` table is syncing; more tables can be enabled in the UI. |
| Zendesk | Not used — skipped. |
| pganalyze | Not used — skipped. |

---

## Scout Troop

26 scouts materialized.

**Enabled (3):**

| Scout | Reason |
|---|---|
| `signals-scout-general` | Always on — cross-product correlations and surfaces no specialist covers |
| `signals-scout-ai-observability` | PolyAgent's core product is AI agent dispatch using Anthropic Claude — primary surface |
| `signals-scout-web-analytics` | Next.js web app instrumented with posthog-js; session recordings confirmed |

**Disabled (23) — representative reasons:**

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by the native `error_tracking` signal sources — duplicating via scout adds noise |
| `signals-scout-session-replay` | Covered by the native `session_replay` signal source |
| `signals-scout-revenue-analytics` | No payment SDK or revenue data found |
| `signals-scout-surveys` | No surveys in use |
| `signals-scout-experiments` | No active A/B experiments found |
| `signals-scout-feature-flags` | No feature flags confirmed in use |
| `signals-scout-logs` | PostHog logs product not in use |
| `signals-scout-csp-violations` | No CSP reporting configured |
| All other scouts | Not among the 1–2 most-used product surfaces for this project |

Re-enable follow-ups are noted in the Follow-ups section for any surface you add later.

---

## Custom Scouts

**Result: None created.**

**Surfaces considered and ruled out:**

| Surface | Filter that killed it |
|---|---|
| Agent run pipeline (run_started / run_failed) | Not watchable — no custom PostHog events exist for agent dispatch yet. Only `$pageview` and `identify` are captured. |
| Vendor dispatch loop | Same — no dispatch events instrumented. |
| Auth / onboarding funnel | Not fully watchable — no custom signup/activation events beyond autocaptured pageviews. |
| LLM cost / performance | Already covered by the enabled `signals-scout-ai-observability`. |
| Web traffic patterns | Already covered by the enabled `signals-scout-web-analytics`. |

**Recommendation:** Instrument agent run events in PostHog (e.g. `agent_run_started`, `agent_run_completed`, `agent_run_failed`, with properties like `vendor`, `model`, `duration_ms`, `status`) and re-run this step. A custom "agent run pipeline" scout will then be able to watch for dispatch failure spikes, latency regressions, and vendor-specific error clusters — none of which any built-in scout can cover today.

**Noise escape hatch:** If any scout becomes noisy, set `emit: false` on its config in PostHog to switch it to dry-run mode (it still runs and logs, but writes nothing to the inbox).

---

## Follow-ups

- [ ] **Enable Error Tracking and Support products** — verify both are on at [PostHog project settings](https://us.posthog.com/project/500869/settings); the `products-enable` API was unavailable during this run.
- [ ] **Connect a Support inbound channel** — the Conversations product is on but tickets only arrive once you connect email / inbox / Slack at [integrations settings](https://us.posthog.com/project/500869/settings/environment-integrations).
- [ ] **Enable more GitHub Issues tables** — only `issues` is syncing for `parvezk/polyagent`. Visit [data sources](https://us.posthog.com/project/500869/data-management/sources) to enable additional tables if needed.
- [ ] **Enable more Linear tables** — only `issues` is syncing. Visit [data sources](https://us.posthog.com/project/500869/data-management/sources) to enable additional tables.
- [ ] **Instrument agent run events** — add `agent_run_started`, `agent_run_completed`, `agent_run_failed` (with `vendor`, `model`, `duration_ms`, `status`) to unlock a custom "agent run pipeline" scout and make `signals-scout-ai-observability` more effective.
- [ ] **Re-enable scouts for surfaces you adopt later** — e.g. `signals-scout-feature-flags` if you add feature flags, `signals-scout-experiments` for A/B tests, `signals-scout-logs` if you enable the PostHog logs product.

---

## What Happens Next

The scout coordinator picks up the fresh configs within ~30 minutes of this run. Scouts run on a 24-hour interval by default. Findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/500869/inbox) — actionable ones can seed coding tasks directly.

GitHub Issues and Linear warehouse sources will complete their first sync within the next hour (depending on data volume); issue-tracker findings will start appearing once that sync completes.
