# REPO_MAP.md — LICW Morsebrowser (React/React Native)

A guided tour of the monorepo: where everything lives, how the pieces fit together, and
where to make a given kind of change. For *how to add lesson/preset/word-file content*,
see [`ADDING_LESSONS_PRESETS_WORDFILES.md`](ADDING_LESSONS_PRESETS_WORDFILES.md).

> Verified against the codebase on 2026-06-14. Test counts and file counts in this doc are
> real numbers from the working tree on that date, not aspirational targets.

---

## The 10,000-foot view

This repo is the React/React Native rewrite of the Long Island CW Club's
[Knockout.js Morse trainer](https://github.com/LongIslandCW/morsebrowser/) (the fork being
matched is `rdreed21/morsebrowser_dev`, `develop` branch). It is a **Turborepo + npm
workspaces monorepo** with one shared engine and two apps:

```
morsebrowser-react/
├── packages/
│   ├── core/        @morsebrowser/core  — the shared Morse engine (no UI, no React)
│   └── types/       @morsebrowser/types — shared TypeScript interfaces
├── apps/
│   ├── web/         Vite + React 19 + Bootstrap 5 web app
│   └── mobile/      Expo + React Native (iOS-first; Android planned) app
├── workers/
│   └── rss-proxy/   Cloudflare Worker — CORS proxy for the RSS reader feature
├── tools/           visual-diff.mjs (screenshot diff vs the KO fork)
├── docs/            ← you are here
└── setup.sh         one-time scaffold script (historical; see docs/archived/)
```

**The golden rule of this codebase:** both apps depend on `@morsebrowser/core`. All Morse
timing, scheduling, lesson catalog logic, preset resolution, and settings persistence live
in `packages/core` exactly once, so the web app and the iOS app produce *identical* timing.
Change the engine once, both apps benefit (and both test suites must still pass).

| Workspace | What it is | Tests (2026-06-14) |
|---|---|---|
| `packages/core` | Shared engine — timing, scheduler, lessons, presets, settings | **71 passing** (Jest, 9 suites) |
| `packages/types` | Shared TS interfaces | — (types only) |
| `apps/web` | React + Bootstrap web app, pixel-matched to the KO fork | **108 passing** (Vitest, 33 files) |
| `apps/mobile` | Expo/React Native iOS app, native background audio | no automated tests yet |

> Note: `apps/mobile` is intentionally **excluded** from the npm workspace
> (`workspaces: ["packages/*", "apps/web"]`) and consumes core via `file:` references with
> its own `.npmrc`, so its Expo/React-Native dependency tree stays isolated.

---

## `packages/core` — the shared engine

Pure TypeScript. **Zero React imports, no JSX.** Everything is re-exported from
`src/index.ts`. This is the heart of the project.

```
packages/core/src/
├── index.ts                  # barrel — re-exports everything below
├── engine/
│   └── morseMap.ts           # ITU character map + prosigns
├── audio/
│   ├── timingEngine.ts       # Farnsworth/PARIS timing math, Koch lesson chars
│   ├── morseScheduler.ts     # schedules tones on the AudioContext clock (NO setTimeout)
│   └── wavExport.ts          # render a sequence to a downloadable WAV
├── lessons/
│   ├── lessonLoader.ts       # lesson catalog cascade + word-file fetching
│   └── wordlists.json        # THE lesson catalog (848 entries) — see data guide
├── presets/
│   ├── presetLoader.ts       # resolve + load presets by class/letterGroup
│   ├── settingsApplier.ts    # apply serialized preset settings to runtime state
│   ├── settingsExport.ts     # export/import user settings as JSON files
│   ├── types.ts              # preset types + DEFAULT_PRESET_KEY_BLACKLIST
│   └── data/                 # preset content (see data guide)
│       ├── config.json       # class → set-file map
│       ├── configs/          # 214 individual preset files
│       ├── sets/             # 11 preset-option sets (one per class group)
│       ├── overrides/        # presetoverrides.json (conditional overrides)
│       └── legacymixin/      # legacymixin.json (defaults for missing keys)
├── settings/
│   ├── settingsManager.ts    # load/save settings (KO cookie-compatible)
│   ├── cookieStorage.ts      # KO_COOKIE_KEYS, cookie read/write
│   └── speedIntervals.ts     # variable-speed (speed interval) helpers
└── __tests__/                # 9 Jest suites (71 tests)
```

### The two hard timing rules (from `CLAUDE.md`)
1. **Never `setTimeout` for Morse timing.** Tones are pre-scheduled on
   `AudioContext.currentTime` in `morseScheduler.ts`. This is what makes timing accurate and
   is the same code path on web (Web Audio API) and mobile (`react-native-audio-api`).
2. **Click-free audio** via short ramp envelopes (`rampTime`, default 5 ms).

### Key public functions
- Lessons: `getWordListCatalog`, `getUserTargets`, `getClasses`, `getLetterGroups`,
  `getDisplays`, `loadWordList`, `loadLessonFile` (`lessons/lessonLoader.ts`).
- Presets: `fetchSettingsPresetsForLesson`, `resolvePresetSettings`, `loadPresetConfigFile`
  (`presets/presetLoader.ts`); `applySerializedSettings` (`presets/settingsApplier.ts`).
- Settings: `settingsManager` + `KO_COOKIE_KEYS` (web persists via cookies for an upgrade
  path from the KO app; mobile persists via `AsyncStorage`).

---

## `packages/types` — shared interfaces

`src/index.ts` only. Defines `MorseTimingConfig`, `MorseSettings`, `Lesson`,
`LessonResult`. Both apps and core import these as `@morsebrowser/types`.

---

## `apps/web` — the web app

Vite + React 19 + Bootstrap 5. The layout deliberately mirrors the KO fork's accordion
order: **Header → Speed → SettingsAccordion → Stats → Playback → Cards → Footer**.

```
apps/web/
├── vite.config.ts
├── vite-wordfiles-plugin.ts  # dev: serve /wordfiles/*  | build: copy into dist/wordfiles/
├── vite-presets-plugin.ts    # dev: serve /presets/*    | build: copy into dist/presets/
├── public/                   # static assets (logo, etc.)
└── src/
    ├── components/           # one folder per UI section (see table below)
    ├── context/              # MorseAppContext, MorseAudioContext
    ├── hooks/                # useMorsePlayer (wraps core scheduleText), playback hooks
    ├── configs/              # licwdefaults.json, wordify.json
    ├── styles/               # Bootstrap overrides / fork CSS
    └── utils/
```

Components (each in `src/components/<Name>/`): `PageHeader`, `SpeedSettingsBar`,
`SettingsAccordion`, `LessonsPicker`, `LessonOptionsPanel`, `VoiceOptionsPanel`,
`ToneOptionsPanel`, `InputOptionsPanel`, `FlaggedWordsAccordion`, `OutputOptionsPanel`,
`RssAccordion`, `WorkingTextStats`, `PlaybackControls`, `WordCards`, `HelpFooter`, plus
shared controls in `components/shared/`.

**State lives in two contexts:** `MorseAppContext` (settings, lesson-picker state, flagged
words → `localStorage`) and `MorseAudioContext` (the single shared `AudioContext` used for
both playback and the Zero-Beat test tone).

**Asset serving:** word files and presets are *not* committed to `apps/web`. The two Vite
plugins serve them in dev and copy them into `dist/` at build time — see
[the data guide](ADDING_LESSONS_PRESETS_WORDFILES.md) for sources and the
`WORDFILES_DIR` / `PRESETS_DIR` overrides.

---

## `apps/mobile` — the iOS app (Android planned)

Expo (~56) + React Native (~0.85), `expo-router` file-based routing. Bootstrap does not
translate to native, so the mobile UI intentionally diverges into a touch-friendly
`StyleSheet` + chip layout while keeping the same section order and behavior.

```
apps/mobile/
├── app/
│   ├── _layout.tsx           # root: configureAudioSession() BEFORE any AudioContext
│   ├── index.tsx             # main practice screen
│   └── settings.tsx          # Tone/Voice/Input/Output/About, reached via gear icon
├── assets/
│   ├── wordfiles/            # 636 lesson files (synced, committed)
│   └── presets/              # preset data (synced from packages/core, committed)
├── scripts/
│   ├── sync-wordfiles.mjs    # copy wordfiles from morsebrowser_dev / WORDFILES_DIR
│   ├── sync-presets.mjs      # copy presets from packages/core/src/presets/data
│   └── generate-asset-manifests.mjs
├── src/
│   ├── audio/audioSession.ts # expo-audio session: background, silent-mode, do-not-mix
│   ├── components/           # native UI (see apps/mobile/MOBILE_STATUS.md)
│   ├── context/              # MorseAppContext, MorseAudioContext
│   ├── hooks/                # useMorsePlayer (react-native-audio-api), useMorsePlayback
│   └── utils/                # theme, lesson loaders, voice, words
├── app.json                  # UIBackgroundModes: audio, RN audio API plugin
└── metro.config.js           # monorepo watch + /wordfiles + /presets dev serving
```

The `sync-*` scripts run automatically via `prestart`/`preios`/`preandroid`. Detailed
status, what's done, and what's left: [`apps/mobile/MOBILE_STATUS.md`](../apps/mobile/MOBILE_STATUS.md).
Android plan: [`ANDROID_FRAMEWORK.md`](ANDROID_FRAMEWORK.md).

---

## `workers/rss-proxy` — RSS CORS proxy

A small Cloudflare Worker (`src/index.ts`) that fetches an RSS feed URL and returns it with
permissive CORS headers so the web app's RSS reader can read arbitrary feeds from the
browser. Deployed by `.github/workflows/deploy.yml` alongside the web build. The web app
points at it via the `VITE_RSS_PROXY` build-time env var; the RSS accordion is only visible
with `?rssEnabled` in the URL.

---

## Build & deploy

- **Local dev:** `npm run dev` (Turbo) or `turbo dev --filter=web` → web app on
  http://localhost:5173.
- **Tests:** `npm test` (Turbo runs every package's `test`). Core uses Jest, web uses
  Vitest.
- **Typecheck:** `npm run typecheck`.
- **CI/CD:** `.github/workflows/deploy.yml` builds the web bundle and deploys it to
  **Cloudflare Pages** (project `morsebrowser`) plus the RSS Worker, on every push to
  `master`. In CI the wordfiles source is the committed copy under
  `apps/mobile/assets/wordfiles` (via `WORDFILES_DIR`), since the sibling `morsebrowser_dev`
  repo isn't checked out there.

`turbo.json` exposes `WORDFILES_DIR`, `PRESETS_DIR`, and `VITE_RSS_PROXY` to the `build`
task so asset sources and the RSS proxy URL can be overridden per environment.

---

## Where do I make a change?

| I want to… | Go to |
|---|---|
| Fix Morse timing / scheduling | `packages/core/src/audio/` (then run core tests + web tests) |
| Change the character/prosign map | `packages/core/src/engine/morseMap.ts` |
| Add/edit a lesson, preset, or word file | [`ADDING_LESSONS_PRESETS_WORDFILES.md`](ADDING_LESSONS_PRESETS_WORDFILES.md) |
| Change web UI / layout | `apps/web/src/components/` (Bootstrap 5, match the KO fork) |
| Change iOS UI | `apps/mobile/src/components/` (native StyleSheet) |
| Change settings persistence | `packages/core/src/settings/` (web) + `apps/mobile` context (mobile) |
| Touch the RSS proxy | `workers/rss-proxy/src/index.ts` |

---

## Related docs

- [`../README.md`](../README.md) — project overview, quick start, run instructions
- [`../CLAUDE.md`](../CLAUDE.md) — hard requirements, current status, KO→React reference
- [`../architecture.md`](../architecture.md) — why the system is shaped this way
- [`../decisions.md`](../decisions.md) — the architecture decision log
- [`../tasks.md`](../tasks.md) — the active work backlog
- [`ADDING_LESSONS_PRESETS_WORDFILES.md`](ADDING_LESSONS_PRESETS_WORDFILES.md) — content guide
- [`../apps/mobile/MOBILE_STATUS.md`](../apps/mobile/MOBILE_STATUS.md) — iOS status
- [`ANDROID_FRAMEWORK.md`](ANDROID_FRAMEWORK.md) — Android plan
- [`LESSON_DATA_PIPELINE.md`](LESSON_DATA_PIPELINE.md) — proposal to unify content sync
- [`archived/`](archived/) — completed migration artifacts (KO audit, agent prompts, scaffold steps)
</content>
</invoke>
