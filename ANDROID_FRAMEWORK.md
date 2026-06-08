# ANDROID_FRAMEWORK.md — Plan for an Android build of LICW Morsebrowser

> **Status:** planning only — no Android work has started. `apps/mobile/app.json` currently
> restricts `"platforms": ["ios"]`. This document maps out what it would take to add
> Android as a first-class target of the **same** Expo app (not a separate codebase).

## TL;DR

`apps/mobile` is an Expo app, and Expo is cross-platform by default — the `"ios"` -only
restriction was a deliberate choice (per `CLAUDE.md`, Agent 4's brief was "Expo +
background audio, test on real iPhone" — Android was simply out of scope for the first
pass). Most of the app — the shared `packages/core` engine, the React component tree, the
chip-based UI, dark mode, settings persistence, navigation — **needs no changes** to run
on Android. The real work is a short, well-scoped list of platform-specific items below,
and the **#1 hard requirement (background audio) looks far less risky than expected**: the
audio library already in use ships an Expo config plugin that wires up Android's
foreground-service media-playback plumbing automatically. See [§ Background audio](#background-audio--the-1-hard-requirement) before assuming this is a multi-week native effort.

---

## What ports over for free

| Layer | Why it's safe |
|---|---|
| `packages/core` (timing engine, `scheduleText`, lessons, presets, settings) | Pure TypeScript, platform-agnostic, already used identically by web and iOS |
| React component tree (`src/components/`, `src/context/`, `src/hooks/`) | Native `StyleSheet` + RN primitives (`View`, `TouchableOpacity`, `TextInput`, …) render on both platforms |
| `expo-router` navigation (`app/_layout.tsx`, `app/index.tsx`, `app/settings.tsx`) | File-based routing is cross-platform; `Stack` headers adapt to platform conventions automatically |
| Dark mode theming (`src/utils/theme.ts`) | Pure JS color maps — no platform dependency |
| Settings persistence (`AsyncStorage` via `settingsPersistence.ts`) | `@react-native-async-storage/async-storage` is cross-platform |
| `expo-speech` (voice/TTS), `expo-document-picker`, `expo-sharing`, `expo-file-system` | All Expo modules ship Android implementations |
| Wordfiles/presets sync + bundled-asset fallback (`loadMobileLessonFile.ts`) | `expo-file-system` paths (`documentDirectory`, `bundleDirectory`) resolve consistently cross-platform |

In short: **don't rewrite anything in `src/` to "port" it**. The work is almost entirely
in `app.json`, native config, a couple of `Platform.OS` branches, and testing.

---

## Background audio — the #1 hard requirement

CLAUDE.md is unambiguous: *"iOS audio through screen lock"* is non-negotiable, and the
Android equivalent (audio surviving backgrounding/screen-lock) matters just as much for a
practice app a club member would run during a commute.

**The good news:** `react-native-audio-api` (already a dependency) ships an Expo config
plugin (`node_modules/react-native-audio-api/src/plugin/withAudioAPI.ts`) that — **by
default** — wires up everything Android needs for background media playback:

- Adds `android.permission.FOREGROUND_SERVICE` and
  `android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK` to the manifest
- Registers `com.swmansion.audioapi.system.CentralizedForegroundService` as a foreground
  service with `foregroundServiceType="mediaPlayback"`

This is the exact mechanism Android requires for any app that plays audio after the user
backgrounds it (Android 8+ kills background work aggressively unless it's a declared
foreground service with a persistent notification). **It's already on by default** — no
`app.json` changes needed to get the plumbing; just add `"android"` to `platforms` and
rebuild.

What still needs **verification on a real device** (the same caveat as iOS — emulators
don't reliably model background/Doze behavior):

1. Does `configureAudioSession()` (`src/audio/audioSession.ts`) need an Android branch?
   It currently early-returns on non-iOS (`if (Platform.OS !== 'ios') return;`). Check
   whether `expo-audio`'s `setAudioModeAsync({ shouldPlayInBackground, interruptionMode })`
   needs Android-specific options (its type defs mark several options `@platform android`
   — e.g. audio focus / ducking behavior) — likely yes, a small `Platform.OS === 'android'`
   branch with Android-appropriate `interruptionMode`/focus settings.
2. Does the foreground service show a notification while practicing? (Android *requires*
   one for `mediaPlayback` services — verify it's not jarring mid-lesson, and that
   `MorseAppContext`/`MorsePlaybackProvider` state doesn't fight with system media
   controls in the notification, e.g. play/pause from the lock screen vs. in-app.)
3. Battery-optimization / Doze: does the practice session survive 10+ minutes locked? Test
   on a device with manufacturer-specific battery management (Samsung, Xiaomi, etc. are
   notoriously aggressive — worth testing on more than one OEM if possible).
4. Audio focus: what happens when a phone call or another media app interrupts? `expo-audio`
   exposes `interruptionMode` — confirm the Android equivalent (`duckOthers`/`doNotMix`)
   produces sane behavior (the current iOS config uses `'doNotMix'`).

---

## Platform-specific work checklist

### 1. `app.json` — enable the platform

```jsonc
{
  "expo": {
    "platforms": ["ios", "android"],
    "android": {
      "package": "com.kq4nkf.morsebrowser",        // Android's bundleIdentifier equivalent
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon-foreground.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.RECORD_AUDIO"               // mirrors NSMicrophoneUsageDescription
      ]
    }
  }
}
```

(`react-native-audio-api`'s plugin adds the foreground-service permissions automatically —
don't duplicate them here.)

### 2. Adaptive icon

Android launchers mask app icons into circles, squircles, rounded squares, etc. — a flat
square PNG (what iOS uses, see `assets/images/icon.png`) gets clipped unpredictably. You
need a **foreground layer** (the LICW emblem, transparent background, sized so the logo
sits within the safe inner ~66% that survives any mask) plus a **background color**
(`#ffffff` to match the iOS icon's white field). `npx expo prebuild` / EAS Build generates
the full adaptive-icon asset set from these two inputs — no manual per-density exports
needed.

### 3. `configureAudioSession()` — add an Android branch

Currently iOS-only (see snippet above). Needs an Android equivalent using `expo-audio`'s
Android-specific `setAudioModeAsync` options — start by reading the `@platform android`
annotations in `expo-audio`'s `Audio.types.d.ts` for the audio-focus / interruption knobs,
and test against the foreground-service notification controls.

### 4. UI/UX — Material vs. Cupertino conventions

The mobile app intentionally diverged from Bootstrap into native `StyleSheet` + chips
(see `MOBILE_STATUS.md`), which is actually an *advantage* here — there's no
iOS-specific chrome to un-pick. Still worth a pass for:

- **Hardware/gesture back button**: `expo-router`'s `<Stack>` handles this for the
  Settings screen automatically, but test the full navigation stack (and any modals/
  pickers) on Android specifically.
- **Touch feedback**: `TouchableOpacity`'s fade is iOS-flavored; Android users expect
  ripple effects (`Pressable` with `android_ripple`, or `TouchableNativeFeedback`). Not a
  blocker, but worth a pass for native feel.
- **Status bar / system navigation bar** theming — `ThemedStatusBar` may need an Android
  branch (edge-to-edge / navigation-bar color APIs differ from iOS).
- **Fonts**: Roboto vs. San Francisco — check that custom font sizes/line-heights in
  `theme.ts`/component styles don't clip or wrap differently.
- **Safe-area insets**: already using `react-native-safe-area-context` — should be fine,
  but Android's gesture-navigation insets are worth a visual check (notch/punch-hole
  cameras vary wildly across OEMs).

### 5. Permissions & manifest

- `RECORD_AUDIO` — mirrors the iOS `NSMicrophoneUsageDescription` (the audio API requires
  it even though this app never records).
- `POST_NOTIFICATIONS` (Android 13+ / API 33) — required to show the foreground-service
  media notification; the plugin may already handle this, but verify on an API 33+ device/
  emulator, since users must explicitly grant it.

### 6. Asset loading — spot-check, don't rewrite

`loadMobileLessonFile.ts` already has a working dev (Metro) → release (bundled →
`documentDirectory` copy) fallback chain using `expo-file-system` paths
(`FileSystem.documentDirectory`, `FileSystem.bundleDirectory`). These resolve correctly
on Android, but the **first real-device test** should confirm the bundled-asset copy step
(`ensureWordfilesCached`/`ensurePresetsCached`) runs cleanly — Android's APK/AAB asset
packaging differs from iOS's app-bundle layout under the hood, even though `expo-file-system`
abstracts it.

---

## Testing strategy

Same lesson as iOS: **the emulator is not the device.**

1. **Android Emulator** (via Android Studio) — fine for UI/layout/navigation passes, but
   does **not** reliably model Doze mode, battery optimization, or OEM-specific background
   restrictions. Don't trust a clean emulator background-audio test as proof it'll survive
   on a real Samsung/Xiaomi/Pixel in someone's pocket.
2. **Real devices** — ideally more than one OEM, since Android fragmentation means
   "works on a Pixel" ≠ "works on a Samsung with aggressive battery management." If club
   members have a mix of Android phones, that's a great informal beta-test pool.
3. Re-run the existing **golden-path checklist** from `MOBILE_STATUS.md` (lesson select →
   playback → settings persistence → dark mode → flagged words) on Android, plus the
   Android-specific background-audio checklist above.

---

## Build & release path

Expo's tooling (EAS) handles Android the same way it handles iOS:

```bash
cd apps/mobile
eas build --platform android --profile preview     # signed APK/AAB for internal testing
eas build --platform android --profile production  # store-ready AAB
```

- **Signing**: EAS can generate and manage an Android keystore for you (recommended —
  losing a self-managed keystore means you can never update the app under the same
  package name again).
- **Distribution for club testing**: Google Play's **Internal testing** track (up to 100
  testers via email, no review wait) or **Closed testing** (larger group, light review) —
  both far faster than the public review queue, and a good parallel to TestFlight on iOS.
- **Google Play Developer account**: one-time $25 registration fee (vs. Apple's $99/year)
  — note this is a *cheaper* ongoing cost than the iOS side.
- **Format**: Play Store requires AAB (Android App Bundle), not raw APK — `eas build`
  produces this by default for production profiles.

---

## Suggested phased rollout

1. **Phase 0 — Bring-up**: add `"android"` to `platforms`, fill in the `app.json` android
   block (package name, adaptive icon placeholder), `npx expo prebuild` + run in the
   emulator. Goal: app launches, lessons load, Morse plays in the foreground. No background
   audio work yet — just confirm the shared engine and UI render correctly.
2. **Phase 1 — Background audio**: verify the `react-native-audio-api` foreground-service
   wiring works out of the box on a real device; add the `configureAudioSession()` Android
   branch; test lock-screen survival across a real practice session length (15-20+ min)
   on at least two OEMs.
3. **Phase 2 — Polish pass**: Material touch-feedback, status/navigation bar theming,
   adaptive icon final art, font/spacing spot-check.
4. **Phase 3 — Internal testing**: EAS build → Google Play internal testing track → club
   beta group (mirrors the iOS TestFlight step already on the iOS roadmap).
5. **Phase 4 — Public release**: Play Store listing (reuse web app screenshots/description
   where possible), production build, submit for review.

## Open questions / risks

- Does `react-native-audio-api`'s Android implementation match its iOS feature set for
  this app's exact use (precise `AudioContext`-clock scheduling, zero `setTimeout` drift
  per CLAUDE.md's #2 hard requirement)? Worth a focused timing-accuracy test early in
  Phase 0 — if there's drift, it's a foundational issue to resolve before investing in
  the rest of the Android work.
- OEM background-restriction variance (see Testing) is the single biggest unknown for
  hitting the #1 hard requirement reliably across the Android install base.
- `expo-speech` voice availability/quality on Android varies by device/OS version — worth
  a quick spot check since voice features are a notable part of the practice experience.
