# decisions.md — architecture decision log

An append-only record of significant technical decisions on this repo: what was decided,
why, and what alternatives were rejected — so nobody (human or agent) re-litigates a
settled question without knowing it was already considered. New entries go at the **top**.
Don't edit old entries except to add a "Status" update (e.g. superseded-by) — the original
reasoning stays intact even if the decision is later reversed.

This is a single running log rather than one-file-per-decision (`docs/adr/NNNN-title.md`)
because this is a solo-maintainer project — simpler beats scalable-for-a-team here.

**Note on dates below:** entries predating 2026-09-11 record decisions already baked into
the codebase before this log existed; the date given is when the decision was effectively
locked in (verified against commit history / doc "last verified" dates where known), not
necessarily the exact day someone typed it out.

---

## 2026-09-11 — Add `architecture.md` / `decisions.md` / `tasks.md` alongside `CLAUDE.md`

**Decision:** split repo-wide persistent context into four files instead of growing
`CLAUDE.md` indefinitely: `CLAUDE.md` (always-loaded operational context), `architecture.md`
(the rarely-changing "why"), `decisions.md` (this file), `tasks.md` (the active backlog).

**Why:** `CLAUDE.md` was starting to accumulate content that doesn't belong in something
meant to be short and always-loaded — architectural rationale and a running task list have
different change frequencies and different audiences than "here's how to work in this
repo today."

**Alternatives considered:** keep everything in `CLAUDE.md` (rejected — makes the always-
loaded file bloated and stale-prone); one-ADR-per-file under `docs/adr/` (rejected for now —
more process than a solo maintainer needs; can migrate to it later if entries get numerous).

---

## 2026-09-11 (dated ~2026-06-xx per commit history) — Remove the `gstack` third-party skill requirement

**Decision:** delete the `## gstack (REQUIRED — global install)` section from `CLAUDE.md`,
along with `.claude/hooks/check-gstack.sh` and its wiring in `.claude/settings.json`.

**Why:** the section instructed any agent working in this repo to clone and execute a
third-party setup script (`garrytan/gstack`) before doing anything else, with explicit
"don't skip this" language — a supply-chain risk pattern (unreviewed third-party code
execution gated behind an instruction embedded in project files). The repo owner added it,
reconsidered, and asked for its removal.

**Alternatives considered:** none — this was a straightforward removal once flagged and
confirmed by the owner. Recorded here mainly so a future agent doesn't wonder why an
`intent.md`-shaped tool wasn't documented that way, or reintroduce a similar pattern without
the same scrutiny.

---

## 2026-09-11 (dated ~2026-06-xx per commit history) — Adopt the AI-Native SDLC workflow

**Decision:** new work on this repo follows Anthropic's AI-Native SDLC Playbook (Plan →
Design → Build → Test → Deploy → Maintain) with committed `intent.md` → `spec.md` →
`plan.md` artifacts per change, documented in `docs/ai-native-sdlc/README.md`.

**Why:** repo owner is learning the model hands-on (both as a personal project and for
professional use) and wanted the discipline of an artifact trail — even solo, "one person
reviewing their own AI-generated plan before it becomes code" beats no gate at all.

**Alternatives considered:** none seriously — this was an explicit adoption request, not a
technical tradeoff between options.

---

## ~2026-06-14 — `packages/core` is pure TypeScript with zero React/JSX

**Decision:** the shared Morse engine (timing, scheduler, lessons, presets, settings) has no
UI framework dependency at all — not React, not React Native primitives.

**Why:** the engine has to run identically inside a browser `AudioContext` (web) and inside
`react-native-audio-api`'s `AudioContext`-shaped surface (mobile). Coupling it to React would
either force one app to adapt to the other's framework assumptions, or require a second
parallel engine — both worse than keeping the engine framework-agnostic.

**Alternatives considered:** a React-hooks-based engine shared via a compat layer (rejected
— adds an abstraction layer for no real benefit, since neither app's UI code needs to touch
engine internals directly, only call its exported functions).

---

## ~2026-06-14 — Never `setTimeout` for Morse tone timing

**Decision:** all tone timing is pre-scheduled against `AudioContext.currentTime` in
`morseScheduler.ts`; `setTimeout` is banned for anything that affects audible timing
(non-timing UI delays like card-reveal pacing are fine).

**Why:** `setTimeout` drifts under JS event-loop pressure (renders, GC, background-tab
throttling), which is audible as uneven dits/dahs — unacceptable for a code-practice tool
where timing accuracy *is* the product. Scheduling against the audio clock hands timing
responsibility to the OS/browser audio subsystem instead of the JS main thread.

**Alternatives considered:** Web Workers to isolate a `setTimeout`-based scheduler from main-
thread jank (rejected — still fundamentally a timer, still can drift, and adds real
complexity for a worse guarantee than audio-clock scheduling gives for free).

---

## ~2026-06-14 — Mobile app excluded from the npm workspace

**Decision:** `apps/mobile` is deliberately **not** listed in the root `workspaces` array
(`["packages/*", "apps/web"]`); it consumes `@morsebrowser/core` via a `file:` reference and
keeps its own `.npmrc`.

**Why:** Expo/React Native's dependency tree has enough quirks (native module resolution,
Metro's own resolution rules) that isolating it from the rest of the workspace's hoisted
`node_modules` avoids cross-contamination — a lesson learned from the tree, not a
theoretical choice.

**Alternatives considered:** full workspace membership (rejected after it caused native
module resolution problems during initial mobile bring-up).

---

## ~2026-06-07 — Consolidated lesson-data sync deferred, not attempted now

**Decision:** keep the current setup — two independent word-file sync paths (web's Vite
plugin, mobile's `sync-wordfiles.mjs`) plus one-time, unautomated copies of the lesson
catalog and presets into `packages/core` — rather than building the single unified sync
script proposed in `docs/LESSON_DATA_PIPELINE.md` right away.

**Why:** the current setup works and the catalog was confirmed still in sync as of
2026-06-07; the unification is a half-day-plus job touching build tooling in three packages
with no user-facing benefit, so it's not worth prioritizing against feature work. It *is* a
real latent-drift risk, which is why it's documented rather than just quietly accepted.

**Alternatives considered:** the unified `packages/core`-owned sync script described in
`LESSON_DATA_PIPELINE.md` (the eventual plan, not rejected — just not now). See `tasks.md`
for where this sits in the backlog.

---

## ~2026-06-14 (agent-brief era) — iOS first, Android deferred

**Decision:** `apps/mobile/app.json` originally restricted `platforms` to `["ios"]`; Android
was explicitly out of scope for the first mobile pass.

**Why:** the original Mobile Agent brief (see `CLAUDE.md`'s Agents table) was scoped to
"Expo + background audio, test on real iPhone" — shipping one platform well before
expanding was judged better than spreading effort across two unverified platforms at once.

**Status: partially superseded.** `app.json` now lists `["ios", "android"]` and an `android`
config block exists (scaffolding only, unverified) — see `docs/ANDROID_FRAMEWORK.md` and
`tasks.md`. iOS remains the platform background-audio has actually been argued to work on;
Android's equivalent is unverified on any real device.

**Alternatives considered:** building both platforms in parallel from the start (rejected —
Hard Requirement #1, background audio, is exactly the kind of thing that needs real-device
verification per platform, and splitting effort risked verifying neither well).

---

## ~2026-06-14 — Web settings via cookies, mobile via `AsyncStorage`, no shared backend

**Decision:** `apps/web` persists settings via cookies using `KO_COOKIE_KEYS` (matching the
original knockout.js app's cookie keys exactly); `apps/mobile` persists via `AsyncStorage`
through `settingsPersistence.ts`. The two don't share a storage mechanism or sync with each
other.

**Why:** web's cookie keys exist specifically to give users upgrading from the KO app a
seamless settings carry-over — that constraint doesn't apply to mobile (a new app with no
predecessor to be compatible with), so mobile uses the RN-native storage primitive instead
of forcing cookie semantics onto a platform that doesn't have them.

**Alternatives considered:** a shared settings-sync backend across platforms (not attempted
— no user request for cross-device settings sync, and it would add real backend
infrastructure this project doesn't otherwise need).

---

## ~2026-06-14 — RSS reader proxied through a separate Cloudflare Worker

**Decision:** `workers/rss-proxy` is its own small Cloudflare Worker (CORS proxy for
arbitrary RSS feed URLs) rather than the web app fetching feeds directly or routing through
Cloudflare Pages Functions inline.

**Why:** browsers can't fetch arbitrary cross-origin RSS feeds directly (no CORS headers on
most feeds) — a thin dedicated proxy is the standard fix, and keeping it as its own Worker
(deployed alongside the Pages site in the same CI job) keeps the web app's build/deploy
simple while isolating the proxy's own small surface area.

**Alternatives considered:** a public third-party CORS proxy (rejected — reliability/
availability outside this project's control for a club tool); inlining proxy logic into the
Vite/Pages build (rejected — mixes a server-side concern into the static site build).

---

## ~2026-06-14 — Bootstrap 5 retained on web, no redesign

**Decision:** the web app stays on Bootstrap 5 and mirrors the KO fork's accordion layout
order exactly, rather than taking the migration as an opportunity to redesign the UI.

**Why:** Hard Requirement #3 — this is a migration for existing LICW club members who know
the current tool, not a relaunch. Changing the framework (knockout.js → React) while
changing the UI at the same time would make it hard to tell "did I break something" from
"did the design just change," and would cost users their muscle memory for no functional
gain.

**Alternatives considered:** a modern component library / design refresh (rejected —
explicitly out of scope per the hard requirement; revisit only if the club itself asks for
a redesign as a separate, deliberate project).

---

## Related docs

- `architecture.md` — the current-state "why is it built this way" reference these
  decisions led to
- `tasks.md` — active backlog, including work that follows from decisions above (e.g. the
  deferred lesson-data consolidation, Android verification)
- `docs/ai-native-sdlc/README.md` — how new decisions get made going forward (intent → spec
  → plan, with the reasoning captured before code, not reconstructed after)
