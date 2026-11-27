# PolyAgent — Speedrun SR008
## Decision note — Wed Oct 28, 2026 (Parvez, Speedrun side chat)
Folder now: `/Users/parvezkose/dev2/polyagent.pro/a16z-SR008` (moved by Parvez Oct 28).

## The pitch line (Parvez adopted this verbatim — record for all drafts)

> "PolyAgent is the layer that carries the artifact, the state, and the review gate across those tools, including the backward and sideways moves, design←dev and verify→design, that a pipeline does not model."

## Locked in this message

1. **Target user: engineers / builders.** Creative technologists and design engineers are out as the primary target — niche roles, shrinking budgets for creative/media assets, made harder by the explosion of vibe-coding and image/video generation tools; Parvez's judgement is that it is a hard sell. This closes the D-vs-E / first-user question from his side: the first user is the cross-phase builder, not the designer/PM (angle E is not the lead).
2. **Wedge and vision, in his words:** aligned with cross-vendor coding dispatch and tracking, because that is where working adapters exist. The vision is the same control plane across research, design, build, and review, across vendors, so the builder is not locked in to one model end-to-end.
3. **One worked example only:** in a single multi-agent pane, Claude owns the research and development streams and Gemini owns the full design phase, because the user prefers Gemini's multimodal capability and cost. Model and version approval inside a vendor family (his example: the Gemini family tiers) is a product detail under the vendor-level story, not a headline.
4. **Arbitrator definition:** PolyAgent sits above the vendors and handles the human-in-the-loop workflow and approval flow, keeping one picture of what is running where, what each agent produced, and what is waiting on the user's judgement, while every job runs on the vendor best at it.
5. **Narrative tool set reduced:** Claude, Gemini, Cursor. Out of the reviewer-facing narrative: Midjourney, Nano Banana, Jules (his framing: lesser-known or less production-related, mostly hobby/art/portfolio). Jules remains a shipped adapter in the repo; this is a narrative cut, not a product claim change.

## Claim-risk notes (Muse, flagged for Parvez — not yet in any draft)

- **"Makes Linear/Asana redundant":** Parvez's raw thesis is that a full arbitrator absorbs the tracking layer, and that pre-AI issue trackers built for standard SDLC/CI-CD roles (scrum masters, program/product managers) are overhead for the AI-native builder. Two risks if stated raw in the application: (a) his own published Substack workflow post calls Linear "the operating system for the projects" — reviewers reading the posts cited as evidence will find the contradiction; (b) it re-expands scope right after the pitch narrowed to the review layer, and invites "so it is a PM tool?" — the exact category he ruled out on Oct 27. Safe form if used at all: for a solo or small AI-native team, the record of agent work (dispatch, status, approvals) lives inside PolyAgent, so maintaining a separate tracker for that work becomes duplication. The roles-becoming-irrelevant claim should stay out of the application entirely; it is an opinion piece, not form material.
- **Model names:** the specific model/version names in his example (future Opus/Fable tiers, an "Argon" tier) are illustrative, not verified product facts — do not put them in drafts.

## Suggested edit to drafts-v3.md (not applied — drafts-v3 is the live doc other agents are editing)

- §Startup description currently names "Claude, Jules, Cursor and Gemini" — per lock 5, trim the narrative list to Claude, Gemini, Cursor.
- The pitch line above is the natural vision sentence for the description or team answer when a redraft makes room; description v3 currently runs 731/800.
