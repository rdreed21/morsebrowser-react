# tasks.md — active work backlog

The running "what's next" board across the whole repo. Where `plan.md` (see
`docs/ai-native-sdlc/`) is the step-by-step plan for *one* in-flight change, this file is
the queue across all of them — what's in progress, what's next, what's parked — so a new
session can see current state without reading git log or three separate status docs.

This file tracks **state**, not detail — each item links to the doc that has the real
writeup. Update it when something starts, finishes, or gets reprioritized; don't let it
drift out of sync with those docs (see `CLAUDE.md`'s Documentation Maintenance Policy).

> Last updated: 2026-09-11

---

## In progress

_Nothing actively in flight right now._

## Next up (Priority 1 — mobile "must-have before calling it done")

1. **Background audio on a real iPhone** — the #1 hard requirement; unverifiable in
   Simulator. See `apps/mobile/MOBILE_STATUS.md` § Hard requirements.
2. **Release bundling for wordfiles + presets** — standalone/EAS builds need a verified
   load path without Metro. See `apps/mobile/MOBILE_STATUS.md` § Priority 1.
3. **`MorsePlaybackContext` refactor** — `useMorsePlayback()` currently instantiated in
   multiple components instead of one shared provider. Same doc, § Priority 1.

## Backlog — mobile feature parity with web (Priority 2)

Tracked as a table in `apps/mobile/MOBILE_STATUS.md` § Priority 2 — sticky sets/speed
intervals UI, Flagged Words full panel, Insert File, WAV download, noise settings, RSS
accordion, deep links, expert settings gating, accessibility announcer. Not re-duplicated
here; that table is the source of truth.

## Backlog — mobile quality & ship (Priority 3)

- Unit/integration tests for `apps/mobile` (currently none — web has 108, core has 71)
- EAS build profile + TestFlight smoke test
- Remove unused deps (`nativewind`, `tailwindcss`)
- Document/trim `node_modules` patches from iOS build troubleshooting
- Optional: silence the benign `RecordingNotificationManager` warning

Detail: `apps/mobile/MOBILE_STATUS.md` § Priority 3.

## Backlog — Android

Scaffolding exists (`app.json` platforms + android block, `Platform.OS` branches in
`loadMobileLessonFile.ts`) but **nothing has been built or run on Android yet**. Phased plan
in `docs/ANDROID_FRAMEWORK.md`:

- Phase 0 — bring-up (`npx expo prebuild`, confirm it launches + plays in the emulator)
- Phase 1 — background audio verification on a real Android device (2+ OEMs)
- Phase 2 — Material polish pass (ripple feedback, status/nav bar theming, adaptive icon)
- Phase 3 — EAS build → Google Play internal testing
- Phase 4 — public release

Not started; parked behind mobile Priority 1 items above (iOS background audio verification
should land first — Android's foreground-service mechanism is a different question, but the
overall mobile app isn't "done" on either platform yet).

## Backlog — lesson/preset data pipeline

Currently three independent mechanisms point at the same upstream (`morsebrowser_dev`), one
with **zero sync automation** (the `wordlists.json` catalog + presets copy into
`packages/core`). Proposed consolidation into one `packages/core`-owned sync script is
written up in full in `docs/LESSON_DATA_PIPELINE.md`. Deliberately deferred — see
`decisions.md` for why (works today, no user-facing benefit yet, touches three packages'
build tooling). Revisit if the catalog is ever caught drifting for real, or during a slow
stretch.

## Backlog — web (Priority ~5%, mostly polish)

`apps/web` is ~95% UI complete per `CLAUDE.md`'s Migration Status table. No dedicated status
doc tracks the remaining ~5% item-by-item today — if/when that work gets picked up, either
list it here directly or spin up a `WEB_STATUS.md` mirroring `MOBILE_STATUS.md`'s shape.

## Backlog — process / tooling

- No CI/CD pipeline exists for `apps/mobile` yet (web + RSS proxy deploy automatically on
  push to `master` via `.github/workflows/deploy.yml`; mobile builds are local/manual EAS
  only). Not urgent until mobile is closer to Priority 1 completion.

## Done recently

- ✅ Settings persistence on mobile (`AsyncStorage`, debounced autosave/restore) — was
  Priority 1 item, shipped ~2026-09.
- ✅ `/settings` screen split on mobile (Tone/Voice/Input/Output/About off the main scroll,
  reached via gear icon).
- ✅ AI-Native SDLC workflow scaffolded (`docs/ai-native-sdlc/`, this file, `architecture.md`,
  `decisions.md`) — 2026-09-11.
- ✅ Removed the `gstack` third-party skill requirement from `CLAUDE.md` and `.claude/`.
- ✅ Full documentation accuracy pass across `CLAUDE.md` and every doc it links to —
  2026-09-11.

## Related docs

- `apps/mobile/MOBILE_STATUS.md` — full mobile detail (this file only summarizes it)
- `docs/ANDROID_FRAMEWORK.md` — full Android plan
- `docs/LESSON_DATA_PIPELINE.md` — full data-consolidation proposal
- `architecture.md` — why the system is shaped this way
- `decisions.md` — why past tradeoffs were made the way they were
- `docs/ai-native-sdlc/README.md` — how new work gets planned (intent → spec → plan)
