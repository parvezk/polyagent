# MISSION — a16z Speedrun SR008 application for PolyAgent

**Goal:** Parvez submits a strong SR008 application by **Fri Oct 30, 2026** (hard deadline Sun Nov 1, 11:59pm PT). Parvez submits himself. Agents draft only, never submit.

**Shared folder (this one):** `/Users/parvezkose/dev2/polyagent.pro/a16z-SR008`. Older notes mention `a16z-speedrun-26`; that path is stale, use this one.

## Files here
- `speedrun.a16z.com_apply_form.pdf` — the form (sections: Team, Startup Details, Additional Information).
- `session-2026-10-26-failure-cases-and-drafts-v1.md` — v1 drafts + reviewer objections (earlier session).
- `drafts-v7.md` — **current working answers (Oct 31)**; notes in its appendix. Follow `writing-rules.md`, but founder voice and energy matter as much (Parvez, Oct 31: v6 "lacks soul"). v2 to v6 are history.
- `build-spec-queue-v1.md` — spec for the Queue screen being built for the video.
- `MISSION.md` — this file. Update "Decisions" when Parvez locks something.

## Locked decisions
1. Full-time: yes. 2. Solo founder, one person, 1 FTE. Unincorporated as confirmed October 28: the saved form instructs 0 in its full-time-founder field. 3. Build in NYC, open to relocating for the SF residency.
4. Founded: TBD (recommended June 2026 = repo created 2026-06-23). 5. No users, no revenue, no funding. Never imply otherwise.

## Still open (Parvez decides)
- October 28 decision: begin with developers coordinating coding tasks across multiple agents. Approved provisional pitch: “PolyAgent helps developers dispatch and track coding agents across vendors in one place.” Specific pain remains under investigation. This supersedes the October 27 pitch-angle status; D/E and the broader horizontal vision remain historical exploration, not selected positioning.
- Founded month, one-liner choice, "where did you learn about Speedrun", whether to record a team video.

## What Speedrun weights (from their FAQ, Oct 2026)
- Team is ~80% of the read: bio and team sections matter most. "Not the place to be humble."
- No traction is fine; they look for **slope**: learning speed, conversations with real users, shipping.
- Team-idea fit can beat traction. Know competitors cold.
- Video: content over polish, tell the story, no AI voice.
- Early applications get the first look.

## Verified facts (Oct 27)
- Repo github.com/parvezk/polyagent: 208 commits, first commit 2026-06-23, last 2026-08-14. 4 vendor adapters (Claude, Jules, Cursor, Gemini) behind one AgentAdapter; CLI + Next.js dashboard, Supabase auth.
- Shipped today: dispatch, status, output, follow-up across vendors. **Not shipped:** side-by-side output comparison / one-prompt fan-out (deck cover shows it as the vision). Phrase it as next, not done.
- Vercel Ship NYC hackathon: top 5 of 23 (per earlier session).
- Use polyagent.pro, GitHub, Loom (loom.com/share/9eae6d05a1c24dfbab4b7b6d34858b98). Don't use raw *.vercel.app deploy URLs (login wall).
- Prior accelerator: NYC Media Lab Combine 2019, DeepViz (explainable ML, NYU Tandon). youtube.com/watch?v=7ODHJkuyU8Q, medium.com/deepviz.
- Form contact email shown: pxkose@gmail.com.

## Latest evidence update — October 28
Read `session-2026-10-28-workflow-evidence.md`. Three founder-authored posts were retrieved. They document attention/steering problems and successful local workarounds, not customer validation. The unincorporated status is confirmed. Degree clarification: Parvez identifies Information Technology as the major and Integrated Digital Media as a category under it; the thesis uses MS (Integrated Digital Media). Preserve both.

## Latest positioning update — October 28, 04:35 (supersedes the 04:14 note above where they differ)
After the 04:14 update, Parvez adopted a north star: **"making agent work understandable to the human who has to approve it."** He agreed vendor neutrality is a feature, not the reason to exist, and that human review is the bottleneck. Constraint from him: build on the PolyAgent core, no restart.
- Audience unchanged: developers coordinating coding work across multiple agents.
- Problem reframed: understanding/approving agent swarm output (who needs input, what drifted, what is safe to merge), not dispatch.
- Product: existing core = collection layer; new review layer on top (plain-language change summary, cross-run conflicts, risk flags, recommendation; human decides). Not shipped; always say "building".
- Evidence: his July/Aug 2026 Substack posts on attention/steering pain (see session-2026-10-28-workflow-evidence.md).
- Drafts: drafts-v3.md. One-liner pick still open (3 options there).

## Oct 29 update (Parvez, newest)
- One-liner locked: "PolyAgent helps developers track, understand and approve coding agents across vendors in one place" (98).
- Prose in v3/v4 rejected as AI-sounding. All drafts must follow writing-rules.md.
- Amazon: Staff Front End Engineer (L6, "Senior" internally). 363 warehouses = 253 NA fulfillment centers + 110 sort centers. Drop EY/Publicis and tech stacks.
- DeepViz: two co-founders, NYC Media Lab Combine 2019 (6 weeks + demo day), $10,000 grant.
- No co-founder or advisors; open to one.
- Vercel Ship NYC (Jun 27, 2026): Parvez says 5 finalists of 24. Not verifiable from the public showcase (PolyAgent not in first 24 cards; more behind "Load more"). Don't claim finalist without proof.
- Parvez keeps returning to "a better Jules across vendors": proactive agents plus one human decision queue. His Jules screenshots (Oct 28) show every recent session stopped at "Needs clarification". Treat as the lead evidence. This overrides the Oct 28 note cutting Jules from the narrative.

## October 29: additional direct founder evidence
Parvez reports that his local agent setup helped within development, but he manually moved design artifacts/work from Flow, AI Studio and Midjourney into Claude Code/Cursor and reconstructed project state after interruptions. See `session-2026-10-29-design-development-handoffs.md`. This supports investigating handoffs and resuming work alongside the decision queue. It does not change the approved one-liner or imply creative-tool integrations exist. Current working answers remain drafts-v5.md.

## Oct 30 update
- Google is shutting down Jules (wind-down Dec 31, 2026; read-only after Nov 11). Parvez: never name Jules in the application. drafts-v6 has no Jules mentions.
- Visualization splits into observability for multi-agent work, and interface design for one vendor-agnostic queue that can connect whatever workstreams a user has (not fixed to research/engineering/design).
- Video: Parvez will record within 24 to 48h; a separate build session is making the Queue screen (build-spec-queue-v1.md) for a 20s screen share.
