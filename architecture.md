# architecture.md — why this repo is built the way it is

This is the **rarely-changing "why"** companion to `CLAUDE.md` (the always-loaded "how to
work here") and `docs/REPO_MAP.md` (the "where is everything" tour). Update this file only
when an architectural decision actually changes — not on every feature. For the record of
*which* decisions were made and why one alternative won over another, see `decisions.md`.

---

## The shape of the system

```
morsebrowser-react/
├── packages/core/    shared Morse engine — pure TypeScript, zero React
├── packages/types/   shared TS interfaces consumed by core + both apps
├── apps/web/         Vite + React 19 + Bootstrap 5
├── apps/mobile/      Expo + React Native, iOS-first (Android scaffolding started)
└── workers/rss-proxy/  Cloudflare Worker, CORS proxy for the RSS reader feature
```

Turborepo + npm workspaces. One shared engine, two independent UI shells. See
`docs/REPO_MAP.md` for the full file-level tour — this doc stays one level up, at the
"why is it split this way" level.

## The golden rule: one engine, two UIs

All Morse timing, scheduling, lesson-catalog resolution, preset resolution, and settings
logic lives in `packages/core` **exactly once**. `apps/web` and `apps/mobile` are both thin
UI shells over the same engine — neither app is allowed to reimplement timing, lesson
lookup, or preset logic locally. This is what guarantees the web and iOS apps produce
*identical* Morse output for the same input, and it's why `packages/core` has zero React
imports: it has to be usable from a browser `AudioContext` and from
`react-native-audio-api` without caring which one it's running under.

**Consequence:** a change to `packages/core` must keep both test suites green (`turbo test`
runs Jest for core and Vitest for web) — that's not a style preference, it's the mechanism
that keeps the two apps from silently drifting apart.

## Timing architecture (Hard Requirement #2)

Morse tone timing is **pre-scheduled on the `AudioContext` clock**, never driven by
`setTimeout`. `morseScheduler.ts` (`packages/core/src/audio/`) computes every tone's
start/stop time up front and schedules them against `AudioContext.currentTime`. This is the
same code path on web (native Web Audio API) and mobile (`react-native-audio-api`, which
implements the same `AudioContext` surface).

**Why not `setTimeout`:** JS timers drift under event-loop pressure (UI re-renders,
GC pauses, background tab throttling) — audible as ragged dits/dahs. Scheduling against the
audio clock instead means the browser/OS's own audio subsystem — not the JS main thread —
is responsible for hitting each tone's timing, which is accurate regardless of what else the
UI thread is doing.

## iOS background audio (Hard Requirement #1)

A practice app is only useful mid-commute if it survives the lock screen. The mechanism:
`UIBackgroundModes: audio` in `apps/mobile/app.json`, `configureAudioSession()` called
before any `AudioContext` is created (`app/_layout.tsx` → `src/audio/audioSession.ts`), and
`react-native-audio-api`'s background-audio support. This only proves out on a **real
device** — the iOS Simulator does not model lock-screen audio behavior, so "works in
Simulator" is never sufficient evidence this requirement is met (see `decisions.md` and
`apps/mobile/MOBILE_STATUS.md` for current verification status).

Android's equivalent mechanism (foreground service + `FOREGROUND_SERVICE_MEDIA_PLAYBACK`)
is scaffolded but unverified — see `docs/ANDROID_FRAMEWORK.md`.

## Fork parity (Hard Requirement #3)

The web app deliberately mirrors `rdreed21/morsebrowser_dev` (the knockout.js fork's
`develop` branch) in layout order and Bootstrap 5 styling — this is a **migration**, not a
redesign, so club members' muscle memory carries over. The mobile app is the one deliberate
exception: Bootstrap doesn't translate to native, so `apps/mobile` intentionally diverges
into a touch-friendly `StyleSheet` + chip UI while preserving the same section order and
behavior as the fork.

## Data flow: lessons, presets, word files

Canonical source for lesson/preset **content** today is still the sibling `morsebrowser_dev`
repo, reached two different ways:

- **Web** (`apps/web/vite-wordfiles-plugin.ts`, `vite-presets-plugin.ts`): serves live from
  `morsebrowser_dev` (or `WORDFILES_DIR`/`PRESETS_DIR`) in dev; copies into `dist/` at build
- **Mobile** (`apps/mobile/scripts/sync-wordfiles.mjs`, `sync-presets.mjs`): copies into
  `assets/`, committed to git, run via `prestart`/`preios`/`preandroid`

The lesson **catalog** (`wordlists.json`, what makes a lesson selectable) and **presets**
were one-time-copied into `packages/core` and are consumed from there by both apps — but
have no sync automation back to the source repo. This asymmetry (content synced per-app,
catalog/presets copied once with no automation) is a known, accepted gap — see
`docs/LESSON_DATA_PIPELINE.md` for the proposed consolidation and `decisions.md` for why
it's deferred rather than fixed now.

## Settings persistence

Two different mechanisms, one per platform, both feeding the same in-memory settings shape
from `packages/core/src/settings/`:

- **Web**: cookies (`KO_COOKIE_KEYS`), matching the original KO app's cookie keys —
  preserves an upgrade path for users coming from the knockout.js version
- **Mobile**: `AsyncStorage` (`apps/mobile/src/utils/settingsPersistence.ts`), debounced
  autosave wired into `MorseAppContext`

Neither platform shares a storage backend with the other — that's intentional, not a gap;
see `decisions.md`.

## Deployment architecture

- **Web + RSS proxy**: pushed to Cloudflare Pages (`morsebrowser` project) and a Cloudflare
  Worker on every push to `master`, via `.github/workflows/deploy.yml`. CI sources word
  files from the committed `apps/mobile/assets/wordfiles` copy (`WORDFILES_DIR`) since the
  sibling `morsebrowser_dev` repo isn't checked out in CI.
- **Mobile**: not yet in any CI/CD pipeline — builds are local (`expo run:ios`) or manual
  EAS builds. No automated release pipeline exists yet (tracked in `tasks.md`).

## AI-native SDLC layer

New work on this repo follows Anthropic's AI-Native SDLC Playbook (Plan → Design → Build →
Test → Deploy → Maintain), with a per-change artifact trail at
`docs/ai-native-sdlc/intent/*.md` → generated `spec.md` → generated `plan.md`. Full
explanation: `docs/ai-native-sdlc/README.md`. This file (`architecture.md`),
`decisions.md`, and `tasks.md` are the **repo-wide, persistent** complement to those
per-change artifacts — they don't get created and archived per feature, they get updated
in place.

## Related docs

- `CLAUDE.md` — hard requirements, current status, commands (always-loaded context)
- `decisions.md` — the ADR log: what was decided, when, and why, including rejected
  alternatives
- `tasks.md` — the active work backlog across the whole repo
- `docs/REPO_MAP.md` — file-level tour of every workspace
- `docs/ai-native-sdlc/README.md` — the per-change intent → spec → plan workflow
