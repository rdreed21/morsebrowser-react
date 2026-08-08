# Speed Racer — club multiplier model (React)

React Speed Racer matches club KO
[`LongIslandCW/morsebrowser`](https://github.com/LongIslandCW/morsebrowser)
`docs/SPEED_RACER.md`: a **multiplier ladder** over main character WPM.

> Supersedes the earlier React-only absolute WPM-steps experiment
> (`speedRacerWpmSteps` / Overlearn direction). Presets and cookies now use
> `speedRacerMultipliers`. Legacy WPM-step cookies/snapshots still convert once
> via `wpmStepsToMultipliers`.

## Behavior

For each card:

1. Play once at each non-zero multiplier: `round(mainWpm * multiplier)`.
2. Optionally **speak** (if Speak + Voice).
3. Optionally **replay** at the **first** multiplier (Replay at First Multiplier).

| Control | Default |
|---|---|
| Multipliers | `1.5, 1.35, 1.175, 1.0` (Jay) |
| Replay at First Multiplier | on |
| Speak / Speak Before Replay | on |
| Overlearn button | `1.348, 1.174, 1.0`; Replay+Speak **off** |

FWPM: `min(savedFwpm, variationWpm)`. Mutual exclusion with Speed Intervals.

## Implementation

| Piece | Location |
|---|---|
| Formulas | `packages/core/src/settings/speedRacer.ts` |
| Preset apply | `packages/core/src/presets/settingsApplier.ts` (`speedRacerMultipliers`) |
| Web UI | `apps/web/.../LessonOptionsPanel.tsx` |
| Web playback | `apps/web/.../useMorsePlayback.ts` + `cardBufferManager.getRepeatState` |
| Voice coupling | `apps/web/src/utils/voicePlayback.ts` |

See club `docs/SPEED_RACER.md` for Tom deep-link examples and preset display names.
