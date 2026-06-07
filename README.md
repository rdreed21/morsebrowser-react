# LICW Morsebrowser — React/React Native Migration

<img alt="Long Island CW Club logo" src="apps/web/public/assets/CW-Club-logo-clear400-300x300.png" width="160" height="160">

## What is this?

This is the **React migration** of the [Long Island CW Club's](https://longislandcwclub.org/)
Morse practice trainer — the [knockout.js original](https://github.com/LongIslandCW/morsebrowser/)
(maintained in the sibling [`morsebrowser_dev`](../morsebrowser_dev) fork) reborn as a
TypeScript monorepo with a shared engine, a modern web app, and a **native iOS app** with
real background audio (lock-screen practice — something the browser version can't do).

| Package | What it is | Status |
|---|---|---|
| [`packages/core`](packages/core) | Shared Morse engine — timing, scheduler, lessons, presets, settings | ✅ Complete (40+ tests) |
| [`apps/web`](apps/web) | React + Bootstrap web app, pixel-matched to the KO fork | ✅ ~95% (93+ tests) |
| [`apps/mobile`](apps/mobile) | Expo/React Native iOS app, native background audio | ✅ Day-to-day practice ready |

Full migration ledger: [`COMPONENT_MAP.md`](COMPONENT_MAP.md). Mobile-specific status:
[`apps/mobile/MOBILE_STATUS.md`](apps/mobile/MOBILE_STATUS.md). Repo-wide hard
requirements and agent roles: [`CLAUDE.md`](CLAUDE.md).

---

## Quick start

```bash
git clone https://github.com/rdreed21/morsebrowser-react.git
cd morsebrowser-react
npm install
```

That installs everything for the whole monorepo (`packages/core`, `apps/web`, `apps/mobile`)
via npm workspaces + [Turborepo](https://turbo.build/).

---

## 🌐 Running the web app

The web app is a Vite + React + Bootstrap port that matches the KO fork's look and feel.

```bash
npm run dev --workspace=apps/web
# or from the repo root:
turbo dev --filter=web
```

Open **http://localhost:5173** — that's it. Hot reload, dark mode, lessons, presets, voice,
and full Morse playback all work in any modern browser.

```bash
npm run build --workspace=apps/web   # production build → apps/web/dist
npm run test  --workspace=apps/web   # vitest
```

---

## 📱 Running the iOS app

The mobile app is an **Expo / React Native** app — it uses the exact same `packages/core`
timing engine as the web app (pre-scheduled on the `AudioContext` clock — no `setTimeout`
drift), wrapped in a native iOS shell with `react-native-audio-api` so Morse keeps playing
**through the lock screen**.

### First-time setup

```bash
cd apps/mobile
npm run sync-wordfiles   # pulls 634 lesson wordfiles (needs morsebrowser_dev as a sibling, or WORDFILES_DIR=...)
npm run sync-presets     # pulls preset configs from packages/core
```

### Run it in the iOS Simulator

```bash
cd apps/mobile
npx expo start --clear   # starts Metro
npx expo run:ios         # builds + launches in Simulator (first run only; reuse the build after)
```

Or, once it's built once, just `npx expo start` and press **`i`** to open the Simulator.

### Run it on a real iPhone (required for the lock-screen audio demo!)

1. Plug in an iPhone, trust the computer.
2. `npx expo run:ios --device` and pick your phone from the list (needs a free Apple ID
   signed into Xcode for ad-hoc signing, or a paid developer account for TestFlight).
3. **This is the one that matters for show-and-tell** — Simulator audio doesn't survive
   backgrounding; a real device does. Lock the screen mid-lesson and the dits and dahs
   keep going.

---

## 🎤 Show-and-tell checklist (for the next club meeting)

A short script for demoing both apps side by side:

1. **Web** — open the dev server (or the [live club site](https://longislandcw.github.io/morsebrowser/index.html))
   on a laptop/projector. Walk through lessons → speed/voice/tone settings → playback →
   word cards → dark mode. This is the "browser, any device" story.
2. **iOS app** — hand around a phone running the dev build. Show:
   - The **gear icon** → Settings page (Tone/Voice/Input/Output tucked away so the main
     practice screen stays uncluttered)
   - Pick a lesson, hit **Play** — watch the accordions auto-collapse to make room
   - **Lock the phone** mid-playback — Morse keeps going. *This is the headline feature
     the web version can't do.*
   - Dark mode toggle, flagged words, settings persisting across a force-quit/relaunch
3. Mention **what's shared**: both apps run the *same* `packages/core` timing engine, so
   the Farnsworth timing you hear is identical on phone and laptop.

---

## 🛠️ Tinkering & contributing

Like the original KO fork, this project tries to stay approachable to ham-radio tinkerers,
not just professional developers — it's just now in TypeScript/React instead of
knockout.js, because the team decided the compile-time safety was worth the (gentle)
learning curve as the feature set grew.

- **Engine / timing / lessons**: `packages/core/src/` — the Morse map, Farnsworth timing,
  `scheduleText`, lesson + preset loaders. Both apps depend on this; change it once, both
  benefit (and both test suites should still pass).
- **Web UI**: `apps/web/src/components/` — React + Bootstrap 5, structured to mirror the
  KO fork's accordion layout exactly (see `COMPONENT_MAP.md` for the KO → React map).
- **iOS UI**: `apps/mobile/src/components/` — native `StyleSheet` + chip UI (Bootstrap
  doesn't translate to native, so the mobile app intentionally diverges into a
  touch-friendly layout while keeping the same section order and behavior).
- **Useful root-level commands**:
  ```bash
  turbo dev --filter=web   # web dev server
  turbo test               # all test suites
  turbo typecheck          # TypeScript across every package
  node tools/visual-diff.mjs   # screenshot diff vs the KO fork
  ```

Found a bug or have a feature idea? Please use the **Issues** tab on
[the KO fork's GitHub](https://github.com/LongIslandCW/morsebrowser/issues) — the club
prefers bug reports there over direct email so nothing gets lost.

---

## 🤖 Planning docs

- [`CLAUDE.md`](CLAUDE.md) — hard requirements (background audio, timing accuracy, fork
  parity), agent roles, KO → React quick reference
- [`COMPONENT_MAP.md`](COMPONENT_MAP.md) — full KO → React component-by-component bible
  and live migration status
- [`AGENT_PROMPTS.md`](AGENT_PROMPTS.md) — scope/build-order notes for each migration agent
- [`apps/mobile/MOBILE_STATUS.md`](apps/mobile/MOBILE_STATUS.md) — iOS app status,
  what's left, known issues
- [`ANDROID_FRAMEWORK.md`](ANDROID_FRAMEWORK.md) — plan for extending the mobile app to
  Android
