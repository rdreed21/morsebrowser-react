# Club KO ↔ React parity audit

**Date:** 2026-08-08 (updated)  
**Club baseline:** `LongIslandCW/morsebrowser` `main` @ `296bf06`  
**React branch:** `cursor/sync-club-lesson-data-9dcc`

## Verdict

```text
PARTIAL → approaching VERIFIED for cutover
Claim: Club KO main and React web have 1:1 feature/content parity
sufficient for a clean site cutover and app publish.
```

Content sync is in place. Speed Racer now uses the **club multiplier model**.
Deferred reinit, Voice First lead-in, sticky tokens, and Fisher–Yates shuffle
were ported in this pass. Remaining gaps are mostly UX chrome / polish.

---

## Layer results

| Layer | Verdict | Notes |
|---|---|---|
| Lesson catalog / presets / wordfiles | **Near VERIFIED** | 850/850 catalog; 252/252 presets; wordfiles match (+2 extras) |
| Speed Racer | **VERIFIED (model)** | Multipliers, Replay at First Multiplier, Overlearn `1.348…`, buffer `getRepeatState` |
| Settings / cookies / preset apply | **Near VERIFIED** | Club keys including `autoCloseSettingsAccordions`, `speedRacerMultipliers` |
| Playback (Voice First, deferred reinit) | **Near VERIFIED** | Skip prime on Speak First; PRE skipped after TTS; deferred lesson reinit |
| Sticky / shuffle loaders | **Near VERIFIED** | Sticky multi-char tokens; Fisher–Yates; intra-group line shuffle |
| UI chrome | **PARTIAL** | RSS/Noise gating, accordion order, scroll-into-view still differ |

---

## Closed this branch

- Club content sync (catalog, presets, wordfiles)
- Masked cards (`CQ DE` → `XX XX`)
- Card buffer empty-pad / between-repeat spaces + `getRepeatState`
- Auto-close settings header toggle
- **Speed Racer → club multipliers** (replaced WPM-steps redesign)
- Deferred lesson/preset reinit while playing/paused
- Voice First: skip `primeSpeechPump` + skip PRE after TTS
- Sticky sets on JSON random lessons; Fisher–Yates shuffle

## Remaining nice-to-haves (non-blocking for curriculum)

- Accordion order / RSS `?rssEnabled=` gate / Noise accordion placement
- `scrollPlaybackIntoView` on Play
- Exact KO `getTimeEstimate` duration loop (still ~6s/word heuristic)
- Prosign-aware letter pools beyond `<…>` tokens already supported
- Mobile SR playback path (state/UI aligned; full buffer racing still web-first)

## Sync command

```bash
MORSEBROWSER_KO_DIR=<club-checkout> node packages/core/scripts/sync-lesson-data.mjs
WORDFILES_DIR=<club>/src/wordfiles npm --prefix apps/mobile run sync-wordfiles
npm --prefix apps/mobile run sync-presets && npm --prefix apps/mobile run generate-asset-manifests
```

## Tests

`turbo test --filter=@morsebrowser/core --filter=web`
