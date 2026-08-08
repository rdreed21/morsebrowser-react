# LESSON_DATA_PIPELINE.md — consolidating lesson/preset data into one spot

> **Status:** partial. Catalog + presets sync via `packages/core/scripts/sync-lesson-data.mjs`.
> Wordfiles still use per-app syncs. Canonical KO source is **club**
> [`LongIslandCW/morsebrowser`](https://github.com/LongIslandCW/morsebrowser) `main`
> (not the personal `morsebrowser_dev` fork).

## The problem

Adding a new lesson means touching **three mechanisms** that should all pull from the
same upstream source (club KO `main`):

| Piece | What it is | Canonical source today | How it reaches the apps |
|---|---|---|---|
| **Lesson content files** | ~636 `.txt`/`.json` practice-text files | `LongIslandCW/morsebrowser` `src/wordfiles/` | Web: `vite-wordfiles-plugin.ts`; Mobile: `apps/mobile/scripts/sync-wordfiles.mjs` |
| **Lesson catalog** (`wordlists.json`) | Maps class/letter-group/display-name → filename | Club `src/wordfilesconfigs/wordlists.json` | `packages/core/scripts/sync-lesson-data.mjs` → `packages/core/src/lessons/wordlists.json` |
| **Presets** | Per-class/lesson settings bundles | Club `src/presets/` | Same sync script → `packages/core/src/presets/data/`; mobile copies from core via `sync-presets.mjs` |

## Sync commands

With club KO checked out as a sibling named `morsebrowser` (or set `MORSEBROWSER_KO_DIR`
/ `WORDFILES_DIR`):

```bash
node packages/core/scripts/sync-lesson-data.mjs
cd apps/mobile && npm run sync-wordfiles && npm run sync-presets && npm run generate-asset-manifests
```

Legacy env `MORSEBROWSER_DEV_DIR` and sibling name `morsebrowser_dev` still work as
fallbacks.

## Remaining consolidation (later)

Make **`packages/core`** the single canonical home for wordfiles too (not only
catalog/presets), so web Vite and mobile Metro both consume core and stop reaching into
the KO checkout at runtime. See the historical proposal notes in git history if needed;
current setup is good enough for day-to-day club syncs.
