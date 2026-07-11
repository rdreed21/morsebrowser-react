# Speed Racer WPM step picker model

This React implementation intentionally models Speed Racer as editable WPM steps rather than KO-style multipliers.

## Default Speed Racer direction

When Speed Racer is enabled, the first three WPM pickers should default from the main page or lesson-configured character WPM:

- Step 1: selected/base WPM
- Step 2: base WPM minus 5
- Step 3: base WPM minus 10

For example, a base speed of `25` creates `25, 20, 15`. Pressing `+` appends the next value by continuing the same 5 WPM difference, so the next value is `10`. Pressing `-` removes the final added speed, but the required three default steps remain.

**Reset to defaults** restores descending steps from the current base WPM, turns **Replay Base Speed** and **Speak** on, and re-enables Voice when SR + Speak are active (KO Reset button parity).

## Overlearn direction

The **Overlearn** action uses the opposite direction and KO Overlearn speak/replay defaults: ascending steps, **Replay Base Speed** off, **Speak** off. A base speed of `23` creates `23, 28, 33`, with added steps continuing upward by 5 WPM.

## Voice / Speak coupling (KO parity)

- **Speak** is the sole Speed Racer speech gate. Recap TTS also requires **Voice**.
- Enabling SR or Speak (while SR is on) auto-enables Voice when the browser is voice-capable.
- Turning Speak off while SR is on restores the lesson voice baseline, forces Voice off, and clears the voice buffer.
- Turning Voice off while SR + Speak are on forces Speak off.
- **Arm Recap** locks the Voice master toggle unless SR + Speak unlock it.
- Preset apply captures a lesson voice baseline for restore when leaving SR / Speak-off.

Helpers live in `apps/web/src/utils/voicePlayback.ts`.

## Shared helper

Use the shared helpers in `packages/core/src/settings/speedRacerSteps.ts` so the web app, iOS, and Android all use the same defaults, add/remove behavior, rounding, and minimum-WPM clamping.

## Preset / mixin notes

- Snapshots serialize `speedRacerWpmSteps`. Legacy `speedRacerMultipliers` still convert when present **and** steps are absent.
- `mergeLegacyMixin` does **not** inject multipliers when `speedRacerWpmSteps` is already in the snapshot (prevents clobbering YOUR_SETTINGS).
- Overlearn SR presets set `speedRacerOverlearnDirection: true` so `+` / Reset continue ascending.
- Enabling Speed Racer from the UI resets steps from the current character WPM; preset apply does not.
