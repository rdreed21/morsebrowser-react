# Mobile App Status — LICW Morsebrowser (iOS)

> **Last updated:** 2026-06-06  
> **Scope:** `apps/mobile/` only  
> **Target:** Expo 56 + React Native 0.85, iOS first (real-device background audio required)

---

## Executive summary

The iOS app **builds, runs on simulator, and supports day-to-day Morse practice** with the core engine from `@morsebrowser/core`. Major UI sections from the web/KO fork are ported in a mobile-native layout (StyleSheet, chip pickers, accordions).

**Rough progress: ~70%** of web day-to-day practice features. **Not production-ready** until background audio is verified on a **real iPhone**, settings persistence is added, and release bundling for wordfiles/presets is hardened.

| Area | Status |
|---|---|
| Core Morse engine (shared) | ✅ Complete (`packages/core`) |
| iOS native build | ✅ Simulator build working |
| Main practice UI | ✅ Usable |
| Lessons + presets | ✅ Dev workflow working |
| Voice (TTS) | ✅ Wired (`expo-speech`) |
| Background audio (screen lock) | ⚠️ Configured, **not verified on device** |
| Settings persistence | ❌ Not started (web uses cookies) |
| Automated tests | ❌ None |
| App Store / EAS release | ❌ Not started |

---

## Hard requirements (non-negotiable)

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | **Background audio / screen lock** | ⚠️ Partial | `UIBackgroundModes: audio` in `app.json`; `configureAudioSession()` on mount; `react-native-audio-api` + `enableBackgroundAudio`. **Must test on real iPhone** — Simulator does not support lock-screen audio. |
| 2 | **Accurate Morse timing** | ✅ Done | `scheduleText` from `@morsebrowser/core` via `useMorsePlayer` + `AudioContext`. No `setTimeout` for tone timing (only for card pacing / voice delays). |
| 3 | **Match fork look/feel** | ⚠️ Partial | Same layout *order* and behavior adapted for mobile; Bootstrap replaced with RN StyleSheet + chip UI. Dark mode theme added. Not pixel-matched to web. |

---

## What’s done

### Infrastructure & native

- [x] Expo 56 + React Native 0.85 monorepo setup (`metro.config.js` watches workspace)
- [x] iOS project generated (`npx expo prebuild`, CocoaPods)
- [x] `react-native-audio-api` plugin with background audio flag
- [x] Peer deps for `expo-router` (safe-area, screens, linking, etc.)
- [x] `SafeAreaProvider` + `react-native-safe-area-context` (RN deprecation fix)
- [x] Dark/light theme system (`src/utils/theme.ts`, `useTheme()`)
- [x] Wordfiles sync script (`npm run sync-wordfiles` → `assets/wordfiles/`, 634 files)
- [x] Metro dev server serves `/wordfiles/*` and `/presets/*` (from core package data)

### Audio stack

| File | Purpose |
|---|---|
| `app/_layout.tsx` | Calls `configureAudioSession()` before any `AudioContext` |
| `src/audio/audioSession.ts` | `expo-audio` session: background, silent mode, do-not-mix |
| `src/hooks/useMorsePlayer.ts` | `AudioContext` from `react-native-audio-api` + `scheduleText` |
| `src/context/MorseAudioContext.tsx` | Shared audio player provider |
| `src/hooks/useMorsePlayback.ts` | Word-by-word playback, loop, trail, voice integration |

### State & data

| File | Purpose |
|---|---|
| `src/context/MorseAppContext.tsx` | App state (settings, lessons, voice, presets fields) |
| `src/utils/loadMobileLessonFile.ts` | Lesson fetch for RN (Metro dev + cached assets) |
| `src/utils/lessonPractice.ts` | Custom group + random JSON lesson text generation |
| `src/utils/words.ts`, `formatTime.ts` | Ported from web |
| `src/hooks/usePresets.ts` | Preset list, apply, Save (share sheet), Load (document picker) |
| `src/utils/speakText.ts`, `voiceSpeech.ts` | TTS text prep + `expo-speech` playback |

### UI components (ported)

Layout order: **Header → Speed → Settings accordions → Stats → Cards → Playback**

| Component | Web equivalent | Status |
|---|---|---|
| `app/index.tsx` | Page shell | ✅ Header, dark mode toggle, scroll layout |
| `SpeedSettingsBar` | Speed settings | ✅ WPM, FWPM, volume, sync lock |
| `SettingsSection` | Accordion item | ✅ Collapsible sections |
| `LessonsPicker` | LICW Lessons + presets | ✅ TYPE/CLASS/CONTENT/LESSON chips, presets Save/Load, auto-load lesson |
| `LessonOptionsSection` | Lesson Options (subset) | ⚠️ Overrides, playback toggles, repeats, trail — **missing** sticky sets, speed intervals, shuffle intra-group UI |
| `VoiceOptionsSection` | Voice Options | ✅ Full panel + playback integration |
| `ToneSettingsSection` | Tone Options | ✅ DIT/DAH Hz, sync, Zero Beat test tone |
| `InputOptionsSection` | Input Options (subset) | ⚠️ View/Hide, Clear, practice textarea — **no** Insert File |
| `OutputOptionsSection` | Output Options (subset) | ⚠️ PRE, word space, card wait/size, show cards — **no** WAV download |
| `WorkingTextStats` | Working text stats | ✅ Time, chars, word count |
| `WordCards` | Word cards | ✅ Reveal/hide (X mask), trail, flag on tap, long-press seek |
| `PlaybackControls` | Playback controls | ✅ Play/pause/stop, nav, loop, shuffle, reveal, voice recap |
| `CheckToggle`, `ThemedNumField` | Shared controls | ✅ Mobile-native toggles/inputs |

### Behavior working in dev (simulator)

- Default practice text (`CQ`, `LICW`) and word cards
- Lesson picker cascade + Apply / auto-load on lesson select
- Preset apply when class/content changes; Save/Load JSON settings
- Morse playback with Farnsworth timing from core
- Voice: speak-after buffer, voice-first, arm recap
- Dark mode across all major surfaces
- Reveal/Hide card text toggle

---

## What’s left

### Priority 1 — Must-have before calling mobile “done”

1. **Background audio on real iPhone**  
   Lock screen during playback; confirm audio continues. This is the #1 hard requirement and cannot be validated in Simulator.

2. **Settings persistence**  
   Web uses cookies (`wpm`, `fwpm`, `hideList`, `darkMode`, voice flags, etc.). Mobile needs `AsyncStorage` (or similar) in `MorseAppContext` with the same keys/logic as `@morsebrowser/core` settings manager.

3. **Release bundling for wordfiles + presets**  
   Dev uses Metro middleware. Standalone/EAS builds need wordfiles in the app bundle (partially configured via `assetBundlePatterns`) and a verified load path in `loadMobileLessonFile.ts` without Metro.

4. **`MorsePlaybackContext`**  
   `useMorsePlayback()` is called from multiple components (creates duplicate hook instances). Web uses a single provider — refactor to one context to avoid subtle playback bugs.

### Priority 2 — Feature parity with web

| Feature | Web | Mobile |
|---|---|---|
| Lesson Options: sticky sets, speed intervals, shuffle intra-group | ✅ UI + playback | ⚠️ State/presets only, no UI / playback wiring |
| Flagged Words accordion (Load As Text, full list) | ✅ | ⚠️ Flag on card tap + count only |
| Input: Insert File | ✅ | ❌ |
| Output: WAV download | ✅ | ❌ |
| Noise settings (white/brown/pink) | ✅ | ❌ |
| RSS accordion | ✅ (optional) | ❌ |
| Help footer / shortcuts | ✅ | ❌ |
| Deep links (`?selectedClass=…`) | ✅ | ❌ |
| Expert settings gating | ✅ | ❌ |
| Variable-speed display during interval playback | ✅ | ❌ |
| Keyboard shortcuts | ✅ | N/A (mobile) |
| Accessibility announcer | ✅ | ❌ |
| Page header (logo, help link) | ✅ | ⚠️ Title + theme toggle only |

### Priority 3 — Quality & ship

- [ ] Unit/integration tests (none today; web has 93+, core has 58+)
- [ ] EAS build profile + TestFlight smoke test
- [ ] Remove unused deps (`nativewind`, `tailwindcss` — styling uses StyleSheet)
- [ ] Document/trim `node_modules` patches from iOS build troubleshooting (prefer upstream fixes)
- [ ] Optional: `LogBox.ignoreLogs` for benign `RecordingNotificationManager` warning from `react-native-audio-api`

---

## Known issues & warnings

| Message | Action |
|---|---|
| `RecordingNotificationManager is not implemented on iOS` | **Ignore.** From `react-native-audio-api` (recording lock-screen API). No-op on iOS; does not affect Morse playback. |
| ~~`SafeAreaView has been deprecated`~~ | **Fixed.** Now uses `react-native-safe-area-context`. |
| iOS Simulator ≠ device for audio | Always verify lock-screen audio on hardware. |
| `useMorsePlayback` multiple instances | Refactor to context (see above). |

---

## Project layout (key files)

```
apps/mobile/
├── app/
│   ├── _layout.tsx          # Root: audio session, providers, SafeAreaProvider
│   └── index.tsx            # Main screen
├── assets/wordfiles/        # 634 lesson files (synced from morsebrowser_dev)
├── scripts/sync-wordfiles.mjs
├── src/
│   ├── audio/audioSession.ts
│   ├── components/          # UI (see table above)
│   ├── context/             # MorseAppContext, MorseAudioContext
│   ├── hooks/               # useMorsePlayer, useMorsePlayback, usePresets
│   └── utils/               # theme, words, lessons, voice, mobile loaders
├── app.json                 # UIBackgroundModes: audio, RN audio API plugin
├── metro.config.js          # Monorepo + /wordfiles + /presets dev serving
└── package.json
```

---

## Commands

```bash
# First-time / after pulling
cd morsebrowser-react && npm install
cd apps/mobile && npm run sync-wordfiles   # needs morsebrowser_dev sibling or WORDFILES_DIR

# Dev (simulator)
cd apps/mobile
npx expo start --clear
npx expo run:ios

# Native rebuild after adding native modules
npx expo run:ios
```

**Wordfiles source:** `../../../morsebrowser_dev/src/wordfiles` (or `WORDFILES_DIR` env).  
**Presets source:** `packages/core/src/presets/data` (served via Metro in dev).

---

## Getting the app onto a real iPhone

Three escalating options depending on how long/untethered the test needs to be.

### 1. Quick tethered run (USB/wireless debugging, Metro required)
For a single test session at your desk. Requires Metro running on the laptop the whole time.
```bash
cd apps/mobile
npx expo run:ios --device
```
Picks your plugged-in (or same-network, wireless-debugging-enabled) iPhone from a list, builds the existing `ios/` Xcode project, and installs it. App quits/misbehaves if Metro stops or the laptop disconnects.

If signing fails (no Apple Developer Team configured yet):
```bash
open ios/*.xcworkspace
```
Target → **Signing & Capabilities** → pick your Apple ID team → enable automatic signing → re-run the command above.

### 2. Standalone install, still tethered once (no Metro needed after install)
Same install step, but bundles the JS so the app doesn't need Metro afterward — good for a quick check that doesn't require unplugging for days:
```bash
npx expo run:ios --device --configuration Release
```
With a **free** Apple ID signing team, this still expires after **7 days** and must be reinstalled from the laptop. With a **paid Apple Developer Program** account ($99/yr), it's valid for the normal 1-year provisioning profile.

### 3. Untethered extended testing — EAS internal/ad-hoc build (recommended pre-TestFlight step)
This is the one for "leave it on my phone for a week, no laptop." Builds in the cloud, installs over the air via a link/QR code, and runs independently of any computer. **Requires a paid Apple Developer Program account** to register the device UDID and sign an ad-hoc IPA.
```bash
cd apps/mobile
eas device:create        # one-time per device: register the iPhone's UDID (opens a registration link, scan/open on the iPhone)
eas build --platform ios --profile preview
```
`eas.json`'s `preview` profile (`"distribution": "internal"`) already does the right thing — no code changes needed. When the build finishes, EAS prints an install link / QR code; open it in Safari on the iPhone and tap **Install**. The app then runs fully standalone — same lifetime as the ad-hoc provisioning profile (typically up to a year), independent of the laptop.

This is the natural last step before submitting to **TestFlight**: once #3 has been soak-tested (background audio across lock/unlock cycles, multi-day use), promote to:
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

---

## Suggested next steps (ordered)

1. Test background audio on a **real iPhone** (lock screen during play).
2. Add **AsyncStorage** persistence for settings (match web cookie keys).
3. Harden **release asset loading** for wordfiles/presets without Metro.
4. Refactor **`MorsePlaybackProvider`** (single playback hook instance).
5. Fill **Lesson Options** gaps (sticky sets, speed intervals UI + playback).
6. **Flagged Words** panel (Load As Text).
7. Add **smoke tests** and EAS/TestFlight path (see "Getting the app onto a real iPhone" above — option 3 is the pre-TestFlight soak-test build).

---

## Related docs

- `COMPONENT_MAP.md` — full KO → React component bible (web-focused; mobile section outdated)
- `CLAUDE.md` — repo-wide hard requirements and agent roles
- `AGENT_PROMPTS.md` — Mobile Agent scope and build order
