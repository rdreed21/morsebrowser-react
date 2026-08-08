# Club KO ↔ React parity audit

**Date:** 2026-08-08  
**Club baseline:** `LongIslandCW/morsebrowser` `main` @ `296bf06`  
**React branch:** `cursor/sync-club-lesson-data-9dcc`

## Verdict

```text
NOT VERIFIED
Claim: Club KO main and React web have 1:1 feature/content parity
sufficient for a clean site cutover and app publish.
```

Content (lessons/presets/wordfiles) is **largely synced**. Behavior is **not 1:1**.
Do not cut over the public club site to React as a drop-in until the blockers
below are closed or explicitly accepted with updated club docs/presets.

---

## Layer results

| Layer | Verdict | Notes |
|---|---|---|
| Lesson catalog / presets / wordfiles | **PARTIAL → near VERIFIED** | 850 catalog entries (semantic match after 5 filename fixes); 252/252 presets identical; wordfiles match club (+2 non-catalog extras: `IB2599.txt`, `README.md`) |
| Settings / cookies / preset apply | **PARTIAL** | Core practice keys apply; intentional SR model change (`multipliers` → `wpmSteps`); `autoCloseSettingsAccordions` now ported |
| UI shell (accordions, deep links, shortcuts) | **PARTIAL** | Most panels present; RSS/Noise gating and accordion order differ |
| Playback behavior | **NOT VERIFIED** | Speed Racer semantics intentionally redesigned; Voice First lead-in, deferred lesson reinit, sticky/shuffle loaders still diverge |

---

## Content evidence (synced this branch)

| Artifact | Club | React | Match |
|---|---|---|---|
| `wordlists.json` entries | 850 | 850 | Semantic yes (byte-diff: pretty-print + `Fam_Words`/`Fam_LN` filename fixes) |
| Preset files under `src/presets` | 252 | 252 | Byte-identical |
| Wordfiles | 636 | 638 | Content match on intersection; React-only extras not in catalog |
| New Tom content | `POL_ING_2`, `POL_Letters_Mix`, `POL_SR*`, `SR_*` | present in core + mobile assets | yes |

Sync command:

```bash
MORSEBROWSER_KO_DIR=<club-checkout> node packages/core/scripts/sync-lesson-data.mjs
WORDFILES_DIR=<club>/src/wordfiles npm --prefix apps/mobile run sync-wordfiles
npm --prefix apps/mobile run sync-presets && npm --prefix apps/mobile run generate-asset-manifests
```

---

## Cutover blockers (must resolve or accept)

1. **Speed Racer not 1:1 with club docs**  
   Club: relative multipliers, “Replay at First Multiplier”, Overlearn `1.348,1.174,1.0` fast→slow.  
   React: absolute WPM steps (`docs/SPEED_RACER_WPM_STEPS.md`), “Replay Base Speed” appends base char WPM, Overlearn button ascends.  
   Club SR presets still load via multiplier→steps conversion, but instructor UX/docs diverge.

2. **Deferred lesson/preset reinit while playing**  
   Club defers mid-play class/preset reloads until terminal stop. React can reload text under an active session.

3. **Voice First lead-in**  
   Club skips silent `primeThePump` when Speak First will speak immediately, and skips PRE after TTS. React still primes/pads — Safari ERROR overlay / dead-air risk.

4. **Loader gaps vs club**  
   Sticky sets on random JSON lessons, Fisher-Yates / intra-group shuffle units, and random-session duration heuristics still differ.

### Closed in this pass (were blockers)

- Hidden-card mask now mirrors KO (`CQ DE` → `XX XX`; Sending `{A A A|…}` → `XXX`).
- Card buffer filters empty Sending pads; wordspace pads only between repeats.
- Header **Auto-close settings panels** toggle + cookie + preset key restored (default on).

---

## Nice-to-have / accepted divergences

- Accordion order: React puts RSS before Input/Output; club has Input→Output→RSS→Noise.
- RSS always visible in React vs `?rssEnabled=` gate in club.
- Noise always shown in Lesson Options vs club toggle + separate accordion.
- Lessons Auto Close may close before OverLearn preset pick.
- `scrollPlaybackIntoView` on Play missing.
- Trail `!hasMoreMorse` gate incomplete.
- `showExpertSettings` / `miscSettingsAccordionOpen` chrome keys unused.

---

## Recommendation for publish cutover

1. Keep club Pages on KO until blockers 1–4 are closed **or** product accepts the React Speed Racer model and updates club `docs/SPEED_RACER.md` + instructor materials.
2. Treat content sync from club `main` as green for this branch.
3. Next engineering pass (priority order): deferred reinit → Voice First prime/PRE skips → sticky/shuffle loader parity → decide SR 1:1 vs documented redesign.

## Tests run

- `turbo test --filter=@morsebrowser/core --filter=web` after content sync: passing.
- Follow-up parity fixes covered by unit tests for `getMaskedDisplay`, `CardBufferManager`, PageHeader auto-close toggle.
