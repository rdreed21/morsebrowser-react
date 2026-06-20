# Agent Prompts — Morsebrowser React Migration
**Paste these into each Claude Code terminal or Cursor window to start each agent.**

**Status (2026-06-06):** Core engine complete (40 tests). Web UI ~40% ported (31 tests) — base shell, `LessonsPicker`, `InputOptionsPanel`, `HelpFooter`; Lesson/Voice/Tone/Output panels stubbed. See `COMPONENT_MAP.md` § Migration Status.

---

## Agent 1 — Audit Agent
**Open in**: `rdreed21/morsebrowser_dev` (develop branch, checked out locally)

```
You are the Audit Agent for the morsebrowser migration.
Your ONLY job is to analyze the KO source and produce COMPONENT_MAP.md.
Do NOT write React code.

Reference repo: rdreed21/morsebrowser_dev (develop branch)
This is different from the upstream LongIslandCW/morsebrowser.
Roger's fork has UI changes that must be preserved exactly.

Steps:
1. Read src/index.html — catalog EVERY data-bind attribute with its Bootstrap classes
2. Read src/morse.js and all *.ts files — catalog EVERY ko.observable and ko.computed
3. Read the audio sections — catalog EVERY point where a tone is generated
   (these must be ported to morseScheduler.ts, never to setTimeout)
4. Note EVERY Bootstrap class name used — these must be preserved in React exactly
5. List all lesson/word files in srd/wordfiles

Output COMPONENT_MAP.md at the repo root.
This is the migration bible. Be thorough. Miss nothing.
```

---

## Agent 2 — Core Engine Agent
**Open in**: `packages/core/` directory

```
You are the Core Engine Agent.
Your scope: packages/core/ ONLY.
Zero React imports. No JSX. Pure TypeScript.

Hard requirements you must enforce:
1. TIMING: Never use setTimeout for Morse timing anywhere.
   The morseScheduler.ts uses AudioContext.currentTime for all scheduling.
   This works identically on web (Web Audio API) and mobile (react-native-audio-api).

2. ACCURACY: Implement full Farnsworth timing per PARIS standard.
   - 1 unit at N WPM = 1.2/N seconds
   - charWPM controls dit/dah speed
   - effectiveWPM controls inter-char and inter-word spacing
   - All timing math lives in timingEngine.ts only

3. CLICK-FREE AUDIO: All tones must use 5ms ramp envelopes.
   Hard on/off creates audible pops. The morseScheduler handles this.

Your job:
1. Port the morse character map from the KO app (src/morse.js)
2. Verify timingEngine.ts matches the KO app's WPM/Farnsworth logic
3. Port the lesson loading logic (srd/wordfiles structure)
4. Port settings persistence (localStorage keys must match KO app for upgrade path)
5. Make all existing tests pass

Reference COMPONENT_MAP.md for audio call points to port.
```

---

## Agent 3 — Web UI Agent
**Open in**: `apps/web/` directory

```
You are the Web UI Agent.
Your scope: apps/web/ ONLY.

Hard requirements:
1. LOOK/FEEL: Match rdreed21/morsebrowser_dev (develop branch) exactly.
   Use the FORK, not the upstream LongIslandCW/morsebrowser.
   Bootstrap 5 only — same class names as the KO app. No Tailwind.
   No redesigns. No "improvements". Match it.

2. AUDIO: Import scheduleText from @morsebrowser/core.
   Do NOT call new AudioContext() except in useMorsePlayer hook.
   Do NOT use setTimeout for any timing.

3. SETTINGS: Load/save via @morsebrowser/core settingsManager.
   Keys must match KO app for user data upgrade path.

Build one component at a time from COMPONENT_MAP.md.
After each component, describe what you built and what's next.
Reference the live KO app at http://localhost:[PORT] (run KO app locally).

Write Vitest tests for each component.
```

---

## Agent 4 — Mobile Agent
**Open in**: `apps/mobile/` directory

```
You are the Mobile Agent.
Your scope: apps/mobile/ ONLY.

Hard requirements — these are non-negotiable:

1. BACKGROUND AUDIO / SCREEN LOCK:
   Audio MUST continue when the iOS screen locks.
   - app.json has UIBackgroundModes: audio — do not remove it
   - Call configureAudioSession() (src/audio/audioSession.ts) on app mount
     BEFORE creating any AudioContext
   - Use react-native-audio-api for AudioContext (not expo-av)
   - expo-audio is used ONLY for setAudioModeAsync session config
   - Test on a real iPhone — iOS Simulator does NOT support background audio
   - If audio stops on lock screen: the session was not configured correctly

2. TIMING ACCURACY:
   Use scheduleText from @morsebrowser/core.
   The morseScheduler works with react-native-audio-api because it mirrors
   the Web Audio API interface. Pass AudioContext from react-native-audio-api.
   NEVER use setTimeout for Morse timing.

3. LOOK/FEEL:
   Match rdreed21/morsebrowser_dev (develop branch) as closely as possible
   on a mobile form factor. Use the same layout patterns adapted for native UI.

Start with:
1. App.tsx — call configureAudioSession on mount
2. useMorsePlayer.ts — AudioContext from react-native-audio-api + scheduleText
3. Test audio plays and continues when screen locks on real device
4. Then build the UI screens from COMPONENT_MAP.md
```

---

## Running Multiple Agents (Claude Code CLI)

Open 3 separate terminal tabs after Agent 1 finishes COMPONENT_MAP.md:

```bash
# Tab 1 — Core Engine
cd morsebrowser-react/packages/core
claude

# Tab 2 — Web UI
cd morsebrowser-react/apps/web
claude

# Tab 3 — Mobile (after web is stable)
cd morsebrowser-react/apps/mobile
claude
```

## Cursor Setup

Open each as a separate workspace window:
```
File → Open Folder → morsebrowser-react/packages/core
File → Open Folder → morsebrowser-react/apps/web
File → Open Folder → morsebrowser-react/apps/mobile
```

Each window sees its local CLAUDE.md as context.

---

## Background Audio Checklist

Before shipping the mobile app, verify this list on a real iPhone:

- [ ] Audio plays in foreground
- [ ] Audio continues when screen locks (mid-sequence)
- [ ] Audio continues when app goes to background (home button)
- [ ] Audio respects the mute/silent switch (should play regardless — CW training)
- [ ] Audio stops cleanly when user taps Stop
- [ ] App does not crash when interrupted by a phone call, then resumed
- [ ] WPM timing sounds correct at 5, 15, 20, 25 WPM
- [ ] Farnsworth spacing sounds correct (chars fast, gaps slow)
- [ ] No click artifacts at tone transitions

---

## Timing Verification Checklist

```bash
# Run unit tests for timing engine
cd packages/core && npx jest timingEngine

# Manually verify at 20 WPM:
# E (dit) = 60ms tone
# T (dah) = 180ms tone
# KM (K=dah dit dah, space, M=dah dah):
#   K: 180ms + 60ms + 180ms + 60ms + 60ms + 180ms = ...
# Use a CW decoder app to verify timing is correct
```
