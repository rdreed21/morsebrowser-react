# Adding Lessons, Presets, and Word Files

A practical, copy-paste guide for content authors. It covers the three kinds of content you
can add and exactly which files to touch for the **web app**, the **iOS app**, or both.

> **Mental model — the three pieces are different things:**
> - A **word file** is the *content* a lesson plays (the words/letters, or a recipe for
>   generating random words).
> - A **lesson** is a *catalog entry* that makes a word file selectable in the picker.
>   Dropping a word file in a folder does **nothing** on its own — it needs a catalog entry.
> - A **preset** is a bundle of *settings* (WPM, volume, voice, etc.) that a learner can
>   apply for a given class/lesson.

Before you start, know where each piece is canonically sourced today:

| Piece | Canonical source | Reaches web via | Reaches mobile via |
|---|---|---|---|
| Word files (`.txt`/`.json`) | `morsebrowser_dev/src/wordfiles` (the KO fork), or `WORDFILES_DIR` | `vite-wordfiles-plugin.ts` (dev serve / build copy) | `npm run sync-wordfiles` → `apps/mobile/assets/wordfiles/` |
| Lesson catalog (`wordlists.json`) | `packages/core/src/lessons/wordlists.json` (core-owned, imported directly) | built into core | built into core |
| Presets (`config.json`, `configs/`, `sets/`…) | `packages/core/src/presets/data/` (core-owned) | `vite-presets-plugin.ts` (dev serve / build copy) | `npm run sync-presets` → `apps/mobile/assets/presets/` |

> ⚠️ **Known sharp edge:** word files live in the sibling KO fork while the catalog and
> presets are core-owned, and `wordlists.json` has **no sync script** — it's a manual copy.
> There's a standing proposal to unify all three into one synced location:
> [`LESSON_DATA_PIPELINE.md`](LESSON_DATA_PIPELINE.md). Until that lands, follow the steps
> below exactly so nothing drifts out of sync.

---

## 1. Adding a word file

A word file holds the practice content. There are two formats, and the loader
(`packages/core/src/lessons/lessonLoader.ts`) picks the path by file extension:

### `.txt` — fixed word/phrase list
One word or phrase per line. Loaded by `loadWordList` / `loadLessonFile`, which splits on
newlines, trims, and drops blank lines.

```
PARIS
CQ CQ
THE QUICK BROWN FOX
73
```

### `.json` — random-word generator config
A "recipe" the app uses to generate random practice words. Must match
`RandomWordListConfig`:

```json
{
  "letters": "rea",
  "minWordSize": 3,
  "maxWordSize": 3,
  "practiceSeconds": 120
}
```

| Field | Meaning |
|---|---|
| `letters` | the character pool to draw from |
| `minWordSize` / `maxWordSize` | word length range |
| `practiceSeconds` | how long the generated session should run |

### Where to put the file

1. **Drop the file in the canonical source:** `morsebrowser_dev/src/wordfiles/`
   (the sibling KO-fork repo). If you don't have that repo checked out next to
   `morsebrowser-react`, set `WORDFILES_DIR` to wherever your word files live.
2. **Web:** nothing else to do for *serving* — the Vite dev server reads the directory
   live (`vite-wordfiles-plugin.ts`), and a production build copies it into
   `dist/wordfiles/`.
3. **Mobile:** run the sync so the file is bundled into the app:
   ```bash
   cd apps/mobile
   npm run sync-wordfiles    # copies into apps/mobile/assets/wordfiles/ (committed)
   ```
   (This also runs automatically on `npm start` / `npm run ios` via the `prestart`/`preios`
   hooks.)

> Filenames may contain spaces (e.g. `Fam_Words - 4.txt`) — the serving layers URL-decode
> them. Stick to the existing naming style so files group sensibly
> (`BC1_*`, `INT2_*`, `ADV1_*`, `POL_*`, `SB1REA1.json`, etc.).

**A word file by itself is not selectable.** To make it appear in the picker, add a lesson
catalog entry (next section).

---

## 2. Adding a lesson (making a word file selectable)

The lesson picker is driven entirely by one file:
**`packages/core/src/lessons/wordlists.json`** (currently 848 entries). It is imported
directly as a TypeScript module by `lessonLoader.ts` — there is no sync script, so this is
the single place to edit.

The picker is a 4-level cascade built from these entries:
**TYPE (`userTarget`) → CLASS (`class`) → CONTENT (`letterGroup`) → LESSON (`display`)**.

Add one object to the `fileOptions` array:

```json
{
  "sort": 42,
  "userTarget": "STUDENT",
  "class": "BC1",
  "letterGroup": "REA",
  "newlineChunking": false,
  "display": "REA — MY NEW DRILL",
  "fileName": "MY_NEW_DRILL.txt"
}
```

| Field | Required | What it does |
|---|---|---|
| `sort` | yes | numeric ordering within its group (lower shows first) |
| `userTarget` | yes | top-level TYPE bucket (e.g. `STUDENT`) |
| `class` | yes | CLASS level (e.g. `BC1`, `BC2`, `INTERMEDIATE`, `ADVANCED`) |
| `letterGroup` | yes | CONTENT level (e.g. `REA`, `TIN`, `PSG`) |
| `newlineChunking` | yes | `true` keeps multi-line entries as units (phrases/sentences); `false` treats each token independently |
| `display` | yes | the human-readable label shown in the LESSON dropdown |
| `fileName` | yes | the word file to load from `/wordfiles/` — must match an existing file from step 1 |

Tips:
- Reuse an existing `userTarget`/`class`/`letterGroup` to slot the lesson into an existing
  branch of the cascade; use new values to create a new branch.
- `fileName` ending in `.json` makes it a random-word lesson; `.txt` makes it a fixed list.
- After editing, rebuild core so both apps pick up the change:
  ```bash
  npm run build --workspace=@morsebrowser/core    # or: turbo build --filter=@morsebrowser/core
  ```
- There's a catalog-integrity test (`packages/core/src/__tests__/catalogIntegrity.test.ts`)
  — run `npm test` to make sure your entry is well-formed.

---

## 3. Adding a preset

A preset is a saved bundle of settings a learner can apply. Presets are **core-owned**,
under `packages/core/src/presets/data/`:

```
data/
├── config.json          # class/letterGroup → which set file to show
├── sets/                # 11 files: the option lists shown in the PRESETS dropdown
│   └── bc1.json
├── configs/             # 214 files: the actual settings bundles
│   └── BC1_Default.json
├── overrides/
│   └── presetoverrides.json   # conditional tweaks by letterGroup/fileName
└── legacymixin/
    └── legacymixin.json       # default values injected when a preset omits a key
```

Resolution flow (`presetLoader.ts`): the learner's `class` + `letterGroup` →
`config.json` picks a **set file** → the set file lists **options** → each option points at
a **config file** of `morseSettings` → `legacymixin` fills gaps → `overrides` apply any
conditional tweaks.

To add a new preset, do these three steps:

### Step 3a — Create the settings bundle (`configs/`)
Add `packages/core/src/presets/data/configs/MY_PRESET.json`. The shape is a `morseSettings`
array of `{ key, value, comment }`:

```json
{
  "morseSettings": [
    { "key": "wpm", "value": 18, "comment": null },
    { "key": "fwpm", "value": 12, "comment": null },
    { "key": "volume", "value": "7", "comment": null },
    { "key": "hideList", "value": true, "comment": null },
    { "key": "voiceEnabled", "value": false, "comment": null }
  ]
}
```

The valid `key` names are the settings the applier understands — see the `KEY_HANDLERS` map
in `packages/core/src/presets/settingsApplier.ts` (e.g. `wpm`, `fwpm`, `volume`,
`xtraWordSpaceDits`, `preSpace`, `stickySets`, `ifStickySets`, `hideList`, `voiceEnabled`,
`voiceSpelling`, `voiceVolume`, `numberOfRepeats`, `speedInterval`, `isShuffledSet`,
`shuffleIntraGroup`, `darkMode`, …). Copy an existing config in the same family (e.g.
`BC1_Default.json`) as your starting point.

> A few keys are intentionally **never applied from a preset** (so a preset can't stomp a
> learner's tone/card-size/spacing choices): `ditFrequency`, `dahFrequency`, `syncFreq`,
> `cardFontPx`, `preSpace` — see `DEFAULT_PRESET_KEY_BLACKLIST` in
> `packages/core/src/presets/types.ts`. Including them is harmless; they're just filtered.

### Step 3b — List it in a set (`sets/`)
Add your config to the relevant set file's `options` so it shows up in the dropdown, e.g.
`sets/bc1.json`:

```json
{
  "options": [
    { "display": "Default 12/8", "filename": "BC1_Default.json" },
    { "display": "My New Preset", "filename": "MY_PRESET.json" }
  ]
}
```

`display` is the label shown to the learner; `filename` must match your file in `configs/`.

### Step 3c — Make sure the set is reachable (`config.json`)
A set only appears for the class/letterGroup that maps to it in `config.json`. If you added
your option to an existing set (e.g. `bc1.json` for class `BC1`), this is already wired and
you're done. If you created a **new** set file, map it:

```jsonc
{
  "classes": [
    // class with no sub-groups: one default set for the whole class
    { "className": "BC1", "defaultSetFile": "bc1.json", "letterGroups": [] },

    // class with sub-groups: per-letterGroup set files, optional defaultSetFile fallback
    {
      "className": "INTERMEDIATE",
      "defaultSetFile": "",
      "letterGroups": [
        { "letterGroup": "INT 1 (12)", "setFile": "int_1_12.json" }
      ]
    }
  ]
}
```

### Optional — overrides and legacy mixin
- **`overrides/presetoverrides.json`** applies extra settings *conditionally*, matched by
  `letterGroup` or by lesson `fileName`. Use it when a specific lesson always needs a tweak
  (e.g. force `stickySets`/`ifStickySets` for a list of "BK" files) regardless of which
  preset is chosen.
- **`legacymixin/legacymixin.json`** lists keys (with defaults) that get injected into every
  preset that doesn't already define them — handy for rolling out a brand-new setting key
  across all old presets at once.

### Make both apps see the new preset
- **Web:** served automatically (`vite-presets-plugin.ts` serves `data/` in dev and copies
  it to `dist/presets/` on build). Rebuild core if your change is consumed via the package
  build:
  ```bash
  npm run build --workspace=@morsebrowser/core
  ```
- **Mobile:** sync the preset data into the app bundle:
  ```bash
  cd apps/mobile
  npm run sync-presets      # copies packages/core/src/presets/data → assets/presets/
  ```
- **Test:** `npm test` — `packages/core/src/__tests__/presets.test.ts` validates preset
  resolution.

---

## Quick checklists

**New word file + lesson (the common case):**
- [ ] Add the `.txt` or `.json` file to `morsebrowser_dev/src/wordfiles` (or `WORDFILES_DIR`)
- [ ] Add a `fileOptions` entry in `packages/core/src/lessons/wordlists.json`
- [ ] `npm run build --workspace=@morsebrowser/core`
- [ ] Mobile only: `cd apps/mobile && npm run sync-wordfiles`
- [ ] `npm test` (catalog integrity) and check the picker in `turbo dev --filter=web`

**New preset:**
- [ ] Add `configs/MY_PRESET.json` (`morseSettings` array)
- [ ] Add it to the right `sets/*.json` `options`
- [ ] If it's a new set file, map it in `config.json`
- [ ] `npm run build --workspace=@morsebrowser/core`
- [ ] Mobile only: `cd apps/mobile && npm run sync-presets`
- [ ] `npm test` and verify the PRESETS dropdown in the web app

---

## Related docs
- [`REPO_MAP.md`](REPO_MAP.md) — full repo tour and architecture
- [`LESSON_DATA_PIPELINE.md`](LESSON_DATA_PIPELINE.md) — proposal to unify the three sources
  into one synced location (removes the manual `wordlists.json` step)
- [`../CLAUDE.md`](../CLAUDE.md) — repo-wide rules and KO→React reference
</content>
