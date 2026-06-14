# LESSON_DATA_PIPELINE.md — consolidating lesson/preset data into one spot

> **Status:** idea captured, not started. Low urgency — current setup works, this is a
> DX/maintainability cleanup for whenever there's a slow afternoon.

## The problem

Adding a new lesson today means touching **three independent mechanisms** that all
happen to point at the same upstream source (`morsebrowser_dev`, the sibling KO-fork
repo) — and one of them has no automation at all, making it an easy step to forget.

| Piece | What it is | Canonical source today | How it reaches the apps |
|---|---|---|---|
| **Lesson content files** | 634 `.txt`/`.json` practice-text files | `morsebrowser_dev/src/wordfiles/` | Two separate sync paths (see below) |
| **Lesson catalog** (`wordlists.json`) | Maps class/letter-group/display-name → filename — **this is what makes a lesson selectable in the UI** | `morsebrowser_dev/src/wordfilesconfigs/wordlists.json` | **One-time copy**, `import`ed directly into `packages/core/src/lessons/wordlists.json`. **No sync script — manual copy required.** |
| **Presets** | Per-class/lesson settings bundles | `morsebrowser_dev/src/presets/` | **One-time copy** into `packages/core/src/presets/data/`. No sync script either, but both apps at least consume *from core* now. |

**Lesson content sync paths** (the two that do exist, independently implemented):
- Web: `apps/web/vite-wordfiles-plugin.ts` — dev server reads live from
  `morsebrowser_dev/src/wordfiles` (or `WORDFILES_DIR` env); production build copies into
  `dist/wordfiles/`
- Mobile: `apps/mobile/scripts/sync-wordfiles.mjs` — copies into
  `apps/mobile/assets/wordfiles/` (committed to git), run via `prestart`/`preios`

**The sharp edge:** dropping a new `.txt`/`.json` file into `assets/wordfiles` doesn't make
a lesson *selectable* — that requires a `wordlists.json` catalog entry, and that file has
**zero automation**. I diffed it against the dev repo's copy on 2026-06-07 and it was still
identical, but there's nothing stopping it from drifting silently the next time someone
adds a lesson over there and forgets this repo exists.

## The proposed consolidation

Make **`packages/core`** the single canonical home for all three pieces (it's the natural
choice — both apps already build on it, and mobile's preset sync already points there
instead of reaching into the dev repo directly):

1. Move/treat `wordfiles/`, `wordlists.json`, and `presets/data/` as **core-owned** —
   either physically relocate them under `packages/core/src/lessons/` or formalize core as
   the place that owns the synced copies (mirroring how `presets/data` already works).
2. Write **one** sync script — e.g. `packages/core/scripts/sync-lesson-data.mjs` — that
   pulls all three from `morsebrowser_dev` (or `WORDFILES_DIR`/equivalent env override) in
   a single run, replacing the two independent wordfiles syncs and filling the
   catalog/presets automation gap.
3. Repoint consumers at core instead of the dev repo:
   - `apps/web`'s `vite-wordfiles-plugin.ts` / `vite-presets-plugin.ts` → serve from
     `packages/core/src/lessons/...` instead of (or in addition to, as a fallback)
     `morsebrowser_dev`
   - `apps/mobile`'s `sync-wordfiles.mjs` / `sync-presets.mjs` → copy from
     `packages/core` instead of `morsebrowser_dev`

**End result:** adding a lesson becomes *drop the file + catalog entry in one place, run
one sync command* — both apps pick it up through their existing (already-working) asset
pipelines, and nothing can silently drift out of sync again.

## Why this is "later" work, not now

- Current setup **works** — the catalog is in sync today, and both apps load lessons
  correctly. This is purely a latent-drift risk + repeated-effort cleanup, not a bug.
- It touches build tooling in three packages (`core`, `web`, `mobile`) and would need a
  careful "does everything still load" pass across both apps + their test suites — a
  half-day-plus job, not a quick patch.
- No user-facing behavior changes, so it can be scheduled whenever convenient rather than
  prioritized against feature work.

## Quick reference for whoever picks this up

- Confirm `WORDFILES_DIR` env override convention (already used by both
  `sync-wordfiles.mjs` and `vite-wordfiles-plugin.ts`) carries through to the new single
  script — keep it, since some contributors may not have `morsebrowser_dev` checked out
  as a sibling.
- `lessonLoader.ts` (`packages/core/src/lessons/`) directly `import`s `wordlists.json` as
  a TS module — moving its physical location may require updating that import path and
  re-running `tsc`/`turbo build` for core before web/mobile will pick up the change.
- Re-run both test suites (`turbo test`) after relocating — `packages/core` has 58+ tests
  and `apps/web` has 93+ that may reference these paths.
