# Speed Racer WPM step picker model

This React implementation intentionally models Speed Racer as editable WPM steps rather than KO-style multipliers.

## Default Speed Racer direction

When Speed Racer is enabled, the first three WPM pickers should default from the main page or lesson-configured character WPM:

- Step 1: selected/base WPM
- Step 2: base WPM minus 5
- Step 3: base WPM minus 10

For example, a base speed of `25` creates `25, 20, 15`. Pressing `+` appends the next value by continuing the same 5 WPM difference, so the next value is `10`. Pressing `-` removes the final added speed, but the required three default steps remain.

## Overlearn direction

Overlearn presets use the opposite direction. A base speed of `23` should create ascending steps such as `23, 28, 33`, with added steps continuing upward by 5 WPM.

## Shared helper

Use the shared helpers in `packages/core/src/settings/speedRacerSteps.ts` so the web app, iOS, and Android all use the same defaults, add/remove behavior, rounding, and minimum-WPM clamping.
