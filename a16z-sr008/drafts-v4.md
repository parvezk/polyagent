# PolyAgent — Speedrun SR008 drafts v4 (Wed Oct 28, 2026)

Builds on drafts-v3.md (v3 prose kept wherever it was strong). Questions follow the form's order (PDF pp.1–6). Limits come from the saved form. Recount characters in the live form before you paste.
Rules: no invented users, metrics, interviews, or traction. [CONFIRM] = a fact only Parvez can verify. [DECIDE] = a founder choice.

Weighting from the Speedrun FAQ (Oct 7, 2026): the team and bio section get about 80% of review time ("not the place to be humble"). With no traction, they look for "slope": learning speed, conversations with users, shipping. Team-idea fit can beat traction. The video is optional: it should be you speaking earnestly, polish doesn't matter, and an AI-generated voice is the one thing to avoid. Early applications get the first look.
SR007 patterns (Demo Day post): the cohort leaned deep tech (robotics, space, defense, world models, physical-AI infra) plus vertical agentic platforms (e.g. Colmez, agents for hazardous waste). In a crowded dev-tools field, the winners have a sharp, ownable insight and clear founder-market fit, not a general orchestration layer.

---

## 1. TEAM

### Q1. Are you full-time or part-time on the startup? * — READY
**Full-time.**

### Q2. Number of Full-Time Founders * — READY (recheck live form)
**0.** The form says applicants who aren't incorporated should enter 0 and list co-founders below. You confirmed on Oct 28 that you're unincorporated. If the live form's wording has changed, enter 1.

### Q3. Total FTE Employees * — READY
**1.**

### Q4. Founder details (CEO) * — NEEDS FOUNDER INPUT
- First / Last name: Parvez / Kose · Email: pxkose@gmail.com (pre-filled)
- Phone (max 50 chars, with country code): [FILL] · SMS consent: optional, your call
- Country / City: United States / New York · Citizenship: [FILL]
- College / University: New York University (Tandon School of Engineering)
- Highest education (optional): Master's. Thesis: MS (Integrated Digital Media), May 2019. Your stated major is Information Technology. Keep both and don't correct either one.

### Q5. Relevant experience * (limit 1000 chars) — READY pending [CONFIRM] facts
Same as v3 with a sharper opening. Count ≈ 930.

> For seven years my work has come back to one question: how do people understand what AI is doing? My NYU Tandon master's thesis (2019) was on explainable deep learning and visual interpretability. I turned it into DeepViz, a startup for explainable ML that went through the NYC Media Lab Combine accelerator to Demo Day in 2019. From 2022 to 2026 I was an engineer at Amazon in Middle Mile technology. There I built Synapse, a conversational AI system that generates interfaces on the fly (React, TypeScript, Python, Bedrock, retrieval, WebSocket streaming), deployed to 363 sortation sites. Before that I spent time at EY and a decade at Publicis Sapient building enterprise platforms. I run Claude, Cursor, Jules, Codex and Gemini agents every day, write publicly about orchestrating them, and built PolyAgent's core alone: 208 commits, four vendor integrations, CLI and web, demoed live at Vercel Ship NYC.

[CONFIRM] 363 sites, Amazon dates and title, "a decade" at Publicis, "seven years". Add one concrete DeepViz result if one exists (pilot, award, press), because the FAQ explicitly asks for past wins. If you placed top 5 of 23 at the hackathon and can show it, add it: "placed top 5 of 23 at Vercel Ship NYC."

### Q6. Years of professional experience * — NEEDS FOUNDER INPUT
[FILL] A decade at Publicis plus EY plus Amazon 2022–26 points to roughly 15+. Use your own number.

### Q7. Are you technical enough to build the product end-to-end? * — READY
**Yes.** (The public repo backs this up.)

### Q8. Links — NEEDS ASSET/INPUT
- LinkedIn *: [FILL URL]
- GitHub (opt): https://github.com/parvezk
- X (opt): [FILL, or leave blank]
- Portfolio (opt): https://www.polyagent.pro, or your personal site / https://parvezk.github.io/pre-thesis/ [DECIDE which]

### Q9. Tell us more about the team * (limit 1000 chars) — NEEDS DECISION (advisors / co-founder line)
This is v3 with the bracket resolved into options. Count ≈ 870 before you add an option sentence.

> PolyAgent is a solo-founder company today, and I am on it full-time. I designed and built the whole core myself: four vendor adapters behind one interface, the CLI, the Next.js dashboard, Supabase auth and state, tests and deploy. I demoed it live at Vercel Ship NYC in June. I am also its first user. Since July I have written publicly about running agent teams in parallel, and about the tmux and Ghostty setup I built just to see which agent needs me and when to step in. That workaround is the product insight: starting agents is not the hard part. Understanding their work fast enough to approve it is. The through-line from DeepViz to PolyAgent is the same: make AI systems legible to the person accountable for them. [OPTION SENTENCE]

[DECIDE] the closing sentence. Pick one and keep it true:
- (a) "I am actively looking for a co-founder with go-to-market depth in developer tools." Honest, and it answers the solo-founder question head-on.
- (b) Name 1–3 advisors who have actually agreed. The FAQ example of a team that got in on its second try did it with advisors. Only use this if someone says yes by Thursday.
- (c) Delete it. **Recommendation: (b) if anyone agrees by Thu, otherwise (a).**

---

## 2. STARTUP DETAILS

### Q10. Startup Name * — READY
**PolyAgent**

### Q11. Pitch your startup in one sentence * (limit 100 chars) — NEEDS DECISION
Options (counted):
- **A. Review layer, developer-specific (RECOMMENDED, 94):** `PolyAgent helps developers understand and approve what their coding agents did, across vendors`
- B. North star (89): `PolyAgent makes the work of AI agent swarms understandable, so humans can approve it fast`
- C. Closest to the Oct 28 approved line (98): `PolyAgent helps developers track, understand and approve coding agents across vendors in one place`
Why A: it follows the FAQ's own example format ("X for Y"), it names a user, and it leads with the review insight instead of the commoditizing dispatch layer. B is the better line for a pitch deck but names no user. C hedges.

### Q12. Startup Description * (limit 800 chars) — READY once the wedge is chosen (written for Wedge 1 below)
v3 text, tightened. Count ≈ 745.

> Developers now run several coding agents at once, often from different vendors. Writing code got cheap, and the human became the bottleneck. Every run ends in a diff, a transcript and a status in a different dashboard, and someone has to work out which agent needs input, which one drifted, and what is safe to merge. PolyAgent is the review layer for that work. Its core already pulls runs from Claude, Jules, Cursor and Gemini into one CLI and web dashboard, with one status model and follow-ups from one place. On top of it I am building the review card: what each agent changed and why, in plain language, where runs conflict, risk flags, and a recommendation the human accepts or rejects. Vendor neutrality is a feature, not the pitch.

**Wedge decision [DECIDE]: which user and which problem first.**
| # | User | Painful moment | Fit with FAQ/SR007 | Risk |
|---|---|---|---|---|
| **1 (REC)** | Senior/staff engineers and tech leads running 3+ coding agents in parallel (solo builders and small teams) | End of day: 5–10 agent PRs to review. Which needs input, what conflicts, what is safe to merge | Strongest founder fit (explainability thesis + DeepViz + your own published pain). You are the user, so you can show slope this week | Vendors may build their own review views. Answer: cross-vendor plus explanation, not dispatch |
| 2 | Eng managers / platform teams governing agent output (audit, risk, approval policy) | "Who approved this agent change, and why?" Compliance and incident review | More B2B $ and enterprise-flavored, the way Colmez is vertical | Longer sales cycle, and no evidence yet |
| 3 | Non-engineers (designers/PMs) shipping through coding agents who can't read diffs | "Is this safe to ship?" | Differentiated, and builds on the old "E" angle | Further from what is built. You'd have to justify it with no users |
Recommendation: **Wedge 1** now. Mention 2 as the expansion path in "Anything else" (one clause). It matches the approved audience, what's already shipped, and the explainability through-line that is your strongest asset on the team-heavy read.

### Q13. Primary Category * — READY
**Infrastructure / Dev Tools.**
### Q14. Secondary Category (optional) — READY
**B2B / Enterprise Applications.** (Leave blank if you go with Wedge 1 for a pure solo-dev story. Either is fine.)

### Q15. Where do you intend to build? * — READY
**United States, New York.** (Mention openness to relocating for the SF residency in "Anything else".)

### Q16. When was your startup founded? * (Month/Year) — NEEDS DECISION
- **June 2026 (RECOMMENDED):** the repo was created 2026-06-23, and the public demo at Vercel Ship NYC was in June. Easy to evidence.
- March 2026: Linear project created (planning only).
- October 2026: the review-layer pivot / full-time start. Accurate for the "new company" story, but it erases the slope you've already shown.

### Q17. Company Website (optional) — READY (verify)
**https://www.polyagent.pro** (returns 200 as of Oct 28. It opens on a sign-in page, so consider adding a public landing line or a demo link.) Don't use the *.vercel.app URLs (login wall).

### Q18. Anything else we should know? (optional, limit 1000 chars) — NEEDS INPUT (conversations)
v3 kept, with relocation and the next milestones added. Count ≈ 960 including the bracket. Trim the bracket to fit.

> PolyAgent has no users or revenue yet and is not incorporated, and I'd rather say that plainly. What exists: a working cross-vendor core in a public repo, a live hackathon demo, and three public posts (July and August 2026) documenting the pain from my own daily work: tracking which agent needs input, catching drift, and redirecting agents at checkpoints. The shift from dispatch to review came from pressure-testing that work this month. Spawning parallel agents is becoming free inside every vendor. Understanding what they did is not. [FILL by Fri, only if real: "This week I spoke with N developers running multiple agents; the most common pain was …"] Next 30 days: ship the first review card on the existing dashboard, open-source the CLI, and put it in front of developers running three or more agents. Later: approval and audit for engineering teams. I'm based in NYC and ready to relocate for the SF residency. Demo: loom.com/share/9eae6d05a1c24dfbab4b7b6d34858b98

---

## 3. ADDITIONAL INFORMATION ("Show us more": the form says these significantly strengthen an application)

### Q19. Team Video (MP4, optional) — NEEDS ASSET (high value)
60–90 s, your own voice, phone camera is fine. Script beats: (1) 2019 DeepViz, making AI explainable. (2) Amazon Synapse in production at scale. (3) "Today I run five coding agents. Writing code is free; understanding what they did is my bottleneck." (4) 20–30 s screen: the dashboard with several runs, then "which of these do I approve?", plus a mock review card labelled "in progress". (5) Full-time, solo, what's next. No AI voice. The Loom is a product demo, not an MP4 team video.

### Q20. Pitch Deck (PDF, optional) — NEEDS ASSET (medium)
5–7 slides: problem, insight, what's shipped vs. what's being built, founder fit, competition, next 30 days. The existing deck cover shows fan-out as the vision. Label it "next", not shipped.

### Q21. Traction (optional) — READY (honest)
> Pre-launch, no users or revenue. Shipped: a working cross-vendor core (Claude, Jules, Cursor, Gemini), CLI + web dashboard, 208 commits since June 2026, live demo at Vercel Ship NYC, three public posts on multi-agent workflow pain (Jul–Aug 2026). [ADD only real conversations from this week.]

### Q22. Funding History (optional) — READY
> None. Bootstrapped.

### Q23. Active Fundraising Round (optional) — READY
> Not currently raising outside Speedrun. [CONFIRM]

### Q24. Referral (optional) — NEEDS INPUT
Name a person who referred you, if one did. Rose Johnson (Speedrun Partner) emailed you on Oct 23 about your started application. That was outreach, not a referral, so don't list her as a referrer unless she says that's fine.

### Q25. Where did you learn about speedrun? * — NEEDS FOUNDER INPUT
[FILL] Source (X / Substack / event / friend), plus optional details (e.g. "speedrun Substack, SR007 Demo Day post").

---

## Submit checklist (Fri Oct 30)
Recount every field in the live form · check for conditional questions the PDF missed · open every link logged out · upload the MP4 if recorded · Parvez submits personally · save the confirmation to this folder.
