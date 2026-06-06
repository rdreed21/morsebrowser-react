# COMPONENT_MAP.md — Morsebrowser KO → React Migration Bible

> **Audit Agent output.** This is a read-only analysis of the **Knockout (KO)** source in
> `rdreed21/morsebrowser_dev` (`develop` branch).
> This fork has **custom UI changes that must be preserved exactly** — both Bootstrap
> classes *and* the fork's own CSS classes are catalogued so nothing is lost in migration.
>
> **Live migration status** is maintained in [§ Migration Status](#migration-status-updated-2026-06-06) below.

## Migration Status (updated 2026-06-06)

Roughly **~95% of KO web UI/behavior** is ported. Base shell, settings accordion, playback, presets, deep links, and voice pipeline match the fork for day-to-day practice.

### Test counts

| Package | Tests | Status |
|---|---|---|
| `packages/core` | 58+ | All passing |
| `apps/web` | 93+ | All passing |
| `apps/mobile` | — | Scaffold only |

### Core engine (`packages/core/`) — **COMPLETE**

| Area | File(s) | Status |
|---|---|---|
| Morse map (ITU + prosigns) | `engine/morseMap.ts` | Done |
| Farnsworth timing | `audio/timingEngine.ts` | Done — matches KO `UnitTimingsAndMultipliers` |
| Audio scheduling | `audio/morseScheduler.ts` | Done — AudioContext clock, no `setTimeout` |
| Lesson catalog + load | `lessons/lessonLoader.ts`, `wordlists.json` | Done — 634 wordfiles via `/wordfiles` |
| Settings persistence | `settings/settingsManager.ts`, `cookieStorage.ts` | Done — KO cookie keys (`wpm`, `fwpm`, `volume`, etc.) |

### Web UI (`apps/web/`) — **IN PROGRESS**

Layout order matches KO: Header → Speed → **SettingsAccordion** → Stats → Playback → Cards → Footer.

| # | Component | Status | Notes |
|---|---|---|---|
| 1 | `PageHeader` | ~80% | Logo, title, dark mode toggle, help anchor |
| 2 | `SpeedSettingsBar` | ~95% | WPM/FWPM/volume, sync lock, variable-speed display during interval playback |
| 3 | `SettingsAccordion` | ~95% | `#accordionArea` shell, React state accordions, auto-close on lesson select |
| 4 | `LessonsPicker` | ~95% | Cascade + PRESETS Save/Load + Tom-style deep links |
| 5 | `LessonOptionsPanel` | ~90% | Overrides/Playback/Timing/Trail; speed intervals + repeats wired |
| 6 | `VoiceOptionsPanel` | ~95% | Full UI; speak-first, buffer, spell, Arm Recap |
| 7 | `ToneOptionsPanel` | ~95% | Split DIT/DAH freq in scheduler; shared AudioContext Zero Beat |
| 8 | `InputOptionsPanel` | ~70% | Practice textarea, View/Hide text, Clear, Insert File |
| 8b | `FlaggedWordsAccordion` | ~85% | Click cards to flag, Load As Text, Clear |
| 9 | `OutputOptionsPanel` | ~90% | PRE/card spacing, cards toggle, WAV download |
| 10 | `RssAccordion` | ~85% | Poll/play/reset; visible with `?rssEnabled`; needs proxy |
| 11 | `NoiseSettingsGroup` | ~95% | Sub-group in Lesson Options; white/brown/pink during playback |
| 12 | `WorkingTextStats` | ~90% | Char count, playing time estimate |
| 13 | `PlaybackControls` | ~95% | CardBufferManager, loop, Arm Recap, keyboard shortcuts |
| 14 | `WordCards` | ~90% | Cards, double-click seek, flag via `f` key |
| 15 | `HelpFooter` | ~95% | Credits, shortcuts, BETA banner on `/dev/` or `?beta=true` |
| 16 | `AccessibilityAnnouncer` | ~90% | Live region; shortcut announcements fixed |

**Web infrastructure in place:**

- `MorseAppContext.tsx` — settings, lesson picker state, flagged words (`localStorage`)
- `MorseAudioContext.tsx` — shared `AudioContext` for playback + Zero Beat
- `useMorsePlayer.ts` — `scheduleText` from core
- `utils/words.ts` — KO brace-aware word split + `getDisplayWord()`
- `utils/lessonPractice.ts` — random practice generator for `.json` lessons
- `components/shared/DropdownPicker.tsx`
- `styles/morsebrowser.css`, `dark-mode.css` (ported from KO fork)
- Vite serves `/wordfiles/*` and `/presets/*` in dev; **production build copies both into `dist/`**

### Behavior still missing (web)

- Expert settings / noise accordion gating (`showExpertSettings`)
- `MorseAppContext` split (maintainability; not user-facing)

### Recommended next steps (web)

1. Production deploy smoke test (built `dist/` on static host)
2. Split `MorseAppContext` for maintainability
3. Mobile app (`apps/mobile`) — background audio on real iPhone

### Commands

```bash
# React web (port 5173) — use THIS URL in the browser
# Lesson files: requires morsebrowser_dev cloned as sibling (../morsebrowser_dev)
cd morsebrowser-react && turbo dev --filter=web

# Production build (copies wordfiles + presets into dist/)
cd apps/web && npm run build

# Tests
cd packages/core && npm test
cd apps/web && npm test
```

---

## 0. Source-of-truth file locations (paths differ from the brief)

The task brief referenced `src/index.html`, `src/morse.js`, and `srd/wordfiles`. The **actual**
files in this repo are:

| Brief said | Actual file | Notes |
|---|---|---|
| `src/index.html` | **`src/template.html`** (1137 lines) | The single KO-bound HTML view. `src/index.js` is the webpack entry. |
| `src/morse.js` | **`src/morse/morse.ts`** (979 lines) | Main view model `MorseViewModel`. All logic is TypeScript. |
| `srd/wordfiles` | **`src/wordfiles/`** (634 files) | `srd/wordfiles/` exists but contains a single stray file `IB2599.txt`; the real corpus is `src/wordfiles/`. |
| `morseScheduler.ts` (target) | **does not exist yet** | Migration target. All Web Audio scheduling below MUST be ported there — never to `setTimeout`. |

**Entry / bootstrap:** `src/index.js` → imports `template.html` + creates `MorseViewModel`, then `ko.applyBindings`.

**Build:** webpack (`webpack.config.js`), TypeScript (`tsconfig.json`), Babel (`.babelrc`).
Prebuild scripts generate finders: `prebuildLessons.js`, `prebuildPresets.js`, `prebuildPresetSets.js`
(produce `morseLessonFinder.js`, `morsePresetFinder.js`, `morsePresetSetFinder.js` — gitignored, regenerate with `npm run prebuild`).

---

## 1. View-model object graph (what each React store/context must replace)

Root: **`MorseViewModel`** (`src/morse/morse.ts`). Composed sub-objects (each a candidate React context/store):

| Member | Type / class | File |
|---|---|---|
| `settings` | `MorseSettings` → `.speed` (`SpeedSettings`), `.frequency` (`FrequencySettings`), `.misc` (`MiscSettings`) | `src/morse/settings/*` |
| `lessons` | `MorseLessonPlugin` | `src/morse/lessons/morseLessonPlugin.ts` |
| `morseVoice` | `MorseVoice` (EasySpeech wrapper) | `src/morse/voice/MorseVoice.ts` |
| `flaggedWords` | `FlaggedWords` | `src/morse/flaggedWords/flaggedWords.ts` |
| `rss` | `MorseRssPlugin` | `src/morse/rss/morseRssPlugin.ts` |
| `morseWordPlayer` | `MorseWordPlayer` (audio façade) | `src/morse/player/morseWordPlayer.ts` |
| `morseLoadImages` | `MorseLoadImages` (icon SVG src lookup) | `src/morse/images/morseLoadImages.ts` |
| `shortcutKeys` | `MorseShortcutKeys` | `src/morse/shortcutKeys/morseShortcutKeys.ts` |
| `cardBufferManager` | `CardBufferManager` | `src/morse/utils/cardBufferManager.ts` |
| `screenWakeLock` | `ScreenWakeLock` | `src/morse/utils/screenWakeLock.ts` |

KO **components** registered in the constructor (these become React components):
`simpleimage`, `noiseaccordion`, `rssaccordion`, `flaggedwordsaccordion`.

---

## 1A. Views / Sections → React components

| # | Section | Primary Bootstrap / custom classes | Visible when | Suggested React component |
|---|---|---|---|---|
| 1 | Page header | `page-header`, `page-title`, `site-logo`, `theme-toggle-btn` | Always | `<PageHeader />` |
| 2 | Basic speed settings | `speed-settings-section`, `speed-input-group`, `morse-settings-num` | Always | `<SpeedSettingsBar />` |
| 3 | Settings accordions shell | `accordion#accordionArea`, `settings-group-accordion` | Always | `<SettingsAccordion />` |
| 4 | LICW Lessons picker | `lessons-picker-row`, dropdown pickers, `lesson-selection-badge` | Accordion open (default) | `<LessonsPicker />` |
| 5 | Lesson Options | `settings-lesson-options-panel`, fieldsets Overrides/Playback/Timing/Trail | Accordion collapsed | `<LessonOptionsPanel />` |
| 6 | Voice Options | `row-cols-5`, btn-check toggles, `form-select` | Accordion collapsed | `<VoiceOptionsPanel />` |
| 7 | Tone Options | `#ditFrequency`, `#dahFrequency`, `#zeroBeatButton` | Accordion collapsed | `<ToneOptionsPanel />` |
| 8 | Input Options | `custom-input-actions`, `working-text-area`, flagged words | Accordion collapsed | `<InputOptionsPanel />` + `<FlaggedWordsAccordion />` |
| 9 | Output Options | `output-settings-actions`, card spacing/size | Accordion collapsed | `<OutputOptionsPanel />` |
| 10 | RSS (experimental) | `rssaccordion` component | `rss.rssEnabled()` | `<RssAccordion />` |
| 11 | Noise (experimental) | `noiseaccordion` component | `noiseEnabled()` | `<NoiseAccordion />` |
| 12 | Working-text stats | `working-text-section`, `working-text-stats` | Always | `<WorkingTextStats />` |
| 13 | Playback controls | `playback-controls`, three `btn-group`s | Always | `<PlaybackControls />` |
| 14 | Word cards | `foreach: words`, dynamic `btn-primary`/`btn-outline-*` | `cardsVisible()` | `<WordCards />` |
| 15 | Help footer | `page-help-footer`, shortcuts table, credits | Always | `<HelpFooter />` |
| 16 | A11y live region | `status.sr-only` | Always | `<AccessibilityAnnouncer />` |

---

## 2. Every `data-bind` in the HTML (with Bootstrap classes)

Format: **element** → binding(s) → classes. Line numbers are into `src/template.html` unless noted.
`MLI` = `morseLoadImages().getSrc('…')` icon source (all are `attr: {src: …}`).

### 2.1 Header (lines 45–67)
| Ln | Element | Bindings | Classes |
|---|---|---|---|
| 51 | `img#logoImage` | `click: logoClick` | `site-logo` |
| 58–63 | `button.theme-toggle-btn` | `click: () => darkMode(!darkMode())`, `attr: {'aria-pressed', title}` | `btn btn-outline-secondary btn-sm theme-toggle-btn` |
| 60–61 | `img.theme-icon` | `attr:{src: darkMode()? sunImage : moonImage}` | `theme-icon` |
| 62 | `span` | `text: darkMode()?'Light mode':'Dark mode'` | — |
| 57 | `a` "Click here for help" | href `#page-help-footer` | `btn btn-outline-primary btn-sm` |

Container classes: `container-fluid page-container`, `row gy-3 row-cols-1`, `col page-header`, `row align-items-center g-3 flex-column flex-md-row justify-content-center`, `col-12 col-md-auto text-center`, `col d-flex flex-column gap-2`, `page-title text-center text-md-start mb-0`, `d-flex flex-wrap gap-2 justify-content-center justify-content-md-start align-items-center`.

### 2.2 Basic speed settings (lines 70–103) — `section.speed-settings-section`
| Ln | Element | Bindings | Classes |
|---|---|---|---|
| 75 | `<simpleimage>` | `params: root,height,width,icon:'speedometerImage',labelText:'WPM'` | (component) |
| 80 | `input#wpm` | `textInput: settings.speed.wpm, hidden: settings.speed.variableSpeedDisplay` | `form-control morse-settings-num` |
| 82 | `input` (vWpm) | `textInput: settings.speed.vWpm, visible: variableSpeedDisplay, enable:false` | `form-control morse-settings-num` |
| 85–86 | `span` (sync wpm) | `click: ()=>settings.speed.syncWpm(!settings.speed.syncWpm())` | `input-group-text` |
| 88 | `input[type=image]` | `attr:{'aria-checked', src: syncWpm()? lockImage:unlockImage}` | — |
| 90 | `input#trueWpm` | `textInput: settings.speed.fwpm, enable:!syncWpm(), attr:{max:trueWpm}, hidden:variableSpeedDisplay` | `form-control morse-settings-num` |
| 92 | `input` (vFwpm) | `textInput: settings.speed.vFwpm, visible: variableSpeedDisplay, enable:false` | `form-control morse-settings-num` |
| 99 | `input#txtVolume` | `textInput: volume` | `form-control morse-settings-num` |

Group classes: `input-group flex-wrap speed-input-group`, `input-group speed-volume-segment`, `input-group-text`.

### 2.3 Accordion shell (lines 106–107)
`section.col` → `div.accordion#accordionArea`. Each section is `div.accordion-item.settings-group-accordion`.

### 2.4 LICW Lessons accordion (lines 109–238) — **open by default** (`collapse show`)
Header badges:
| Ln | Element | Bindings |
|---|---|---|
| 119 | `span.badge.bg-success.lesson-selection-badge` | `if: lessons.selectedDisplay().display` |
| 120–127 | `span`×5 | `text: lessons.userTarget / selectedClass / letterGroup / selectedDisplay().display / selectedSettingsPreset().display` |
| 129 | `span.badge.bg-success` | `if: !lessons.selectedDisplay().display` (None Selected) |

Five **dropdown pickers** (`div.row.g-2.lessons-picker-row`, each col `col-6 col-md-4 col-lg lessons-picker-col`, label `lessons-picker-label`, dropdown `dropdown lessons-picker-dropdown`):

| Picker | Toggle button text bind / enable | `foreach` list | item click |
|---|---|---|---|
| **TYPE** (141) | `text: lessons.userTarget()\|\|'Select type'` | `lessons.userTargets` | `$root.lessons.changeUserTarget($data)` ; `css:{active:…}` |
| **CLASS** (156) | `text: lessons.selectedClass()\|\|'Select class', enable: classes().length>0` | `lessons.classes` | `$root.lessons.changeSelectedClass($data,'click')` |
| **CONTENT** (172) | `text: lessons.letterGroup()\|\|'Select content', enable: letterGroups().length>0` | `lessons.letterGroups` | `$root.lessons.setLetterGroup($data,'click')` |
| **LESSON** (188) | `text: selectedDisplay().display\|\|'Select lesson', enable: displays().length>0 ? !displays()[0].isDummy:false` | `lessons.displays` (item `if:!$data.isDummy`) | `$root.lessons.setDisplaySelected($data,false,'click')` |
| **PRESETS** (204) | `text: selectedSettingsPreset().display\|\|'Select preset', enable: allowSaveCookies && settingsPresets().length>0` | `lessons.settingsPresets` | `$root.lessons.setPresetSelected($data,false,'click')`, `enable:$root.allowSaveCookies` |

Toggle button classes: `btn btn-outline-primary dropdown-toggle w-100`; menu `dropdown-menu w-100`; items `dropdown-item` (id `btnLessonSettingsPresets` for preset).
Preset actions (219–231): `div.lessons-preset-actions` with `button#saveSettingsButton` `click:()=>saveSettings()`, `button#loadSettingsButton` `onclick=…settingsfiletoread.click()`, `input[type=file]#settingsfiletoread` `event:{change: settingsFileChange($element)}`. Both buttons `btn btn-outline-primary`.

### 2.5 Lesson Options accordion (lines 239–506) — collapsed
Header button `#moreSettingsAccordionButton` `accordion-button collapsed`; icon `gearImage` (fork design standard — book is reserved for LICW Lessons accordion only; KO template still has `bookImage` here).
Panel `settings-group-panel settings-lesson-options-panel d-flex flex-column gap-3`. Five `<fieldset class="morse-settings-fieldset">` (`legend.morse-settings-legend`):

**Overrides** (252–318): strip `settings-lesson-control-strip`, controls `settings-lesson-control`.
| Ln | Control | Binding |
|---|---|---|
| 262 | `input#btncheckcustomgroup` (btn-check) | `checked: lessons.ifCustomGroup` |
| 269 | `input` custom group text | `textInput: lessons.customGroup, visible: lessons.ifCustomGroup` (`morse-settings-text-short`) |
| 274 | `input#btncheck2` | `checked: lessons.ifOverrideTime` |
| 283 | `input` mins | `textInput: lessons.overrideMins` (group `visible: lessons.ifOverrideTime`) |
| 289 | `input#btncheck2overridesize` | `checked: lessons.ifOverrideMinMax` |
| 298 | `input` min | `textInput: lessons.overrideMin` |
| 303 | `span` sync size | `click: ()=>lessons.syncSize(!syncSize()), attr:{'aria-checked'}` ; icon `lockImage/unlockImage` |
| 308 | `input` max | `textInput: lessons.overrideMax, enable:!syncSize(), attr:{min: lessons.trueOverrideMin}` |
| 314 | `button#btnApply` | `click: ()=>doApply(true), enable: applyEnabled` (`btn btn-primary`) |

All checkbox labels show check/circle icon via `attr:{src: <obs>()? checkImage:circleImage}`.

**Playback** (320–372): strip of `settings-lesson-control`:
| Ln | id | Binding |
|---|---|---|
| 325 | `btncheck1` | `checked: lessons.randomizeLessons` |
| 333 | `btncheckautoclose` | `checked: lessons.autoCloseLessonAccordion` |
| 341 | `btncheck2stickysetstoggle` | `checked: lessons.ifStickySets` ; text `textInput: lessons.stickySets, visible: ifStickySets` |
| 352 | `btnchecknewlinechunking` | `checked: settings.misc.newlineChunking` (Keep Lines) |
| 361 | `btnshuffleintragroup` | `checked: shuffleIntraGroup` (always visible) |

**Timing** (374–459): `settings-inline-row d-flex flex-wrap gap-2 align-items-start`.
- Speed intervals `input-group flex-wrap speed-interval-input-group`:
  - 381 `#btncheckspeedinterval` `checked: settings.speed.speedInterval`
  - 401 `#intervalTimingsText` `textInput: settings.speed.intervalTimingsText, enable+visible: speedInterval()` (`morse-settings-text-interval`); icon `stopwatchImage`, `rocketTakeoffImage`
  - 407 `#intervalWpmText` `textInput: settings.speed.intervalWpmText, …`
  - 413 `#intervalFwpmText` `textInput: settings.speed.intervalFwpmText, …`
- Repeats `input-group flex-wrap`:
  - 428 `#numberOfRepeats` `textInput: numberOfRepeats` ; icon `repeatImage`
  - 436 `#speakFirstAdditionalWordspaces` `textInput: morseVoice.speakFirstAdditionalWordspaces` ; icon `stopwatchImage`
- Noise toggle (447) `col-auto visible:!noiseHidden`: `#btnchecknoise` `checked: noiseEnabled` ; icons `soundwaveImage`, check/circle

**Trail** (461–502): `input-group flex-wrap trail-settings-row`:
| Ln | id | Binding |
|---|---|---|
| 465 | `#btntrailReveal` | `checked: trailReveal` ; label icon `eyeImage/eyeslashImage` |
| 478 | `#trailPreDelay` | `textInput: trailPreDelay, enable: trailReveal()` |
| 487 | `#trailPostDelay` | `textInput: trailPostDelay, enable: trailReveal()` |
| 496 | `#trailFinal` | `textInput: trailFinal, enable: trailReveal()` |

### 2.6 Voice Options accordion (lines 508–771) — collapsed
Header `#voiceOptionsAccordionButton` `click: morseVoice.initEasySpeech`; icon `chatquoteImage`.
Row `row row-cols-5 gx-2 gy-2`. All sub-controls **stay visible, become disabled** via `enable: morseVoice.voiceEnabled()`.
| Ln | id | Binding | Icon |
|---|---|---|---|
| 526 | `#btncheckvoice` | `checked: morseVoice.voiceEnabled, enable: voiceCapable() && !manualVoice()` | chatquote |
| 541 | `#btncheckvoicespell` | `checked: morseVoice.voiceSpelling` | spellcheck |
| 555 | `#btncheckmanualVoice` | `checked: morseVoice.manualVoice` (Arm Recap) | bootstrapReboot |
| 570 | `#btncheckspeakfirst` | `checked: morseVoice.speakFirst` (Voice First) | chatRightDots |
| 616 | `#voiceThinkingTime` | `textInput: morseVoice.voiceThinkingTime` ; `text: morseVoice.voiceThinkingTimeWpm` | stopwatch |
| 632 | `#voiceAfterThinkingTime` | `textInput: morseVoice.voiceAfterThinkingTime` | stopwatch |
| 645 | `select#selectVoiceDropdown` | `options: morseVoice.voiceVoices, optionsText:'name', optionsValue:'idx', value: morseVoice.voiceVoiceIdx, optionsCaption, enable: voiceEnabled() && voiceVoices().length` | `form-select` |
| 660 | `#voiceVolume` | `textInput: morseVoice.voiceVolume` | volume |
| 669 | `#btnvoicelastonly` | `checked: morseVoice.voiceLastOnly` (Last Only) | alignend |
| 688 | `#voicePitch` | `textInput: morseVoice.voicePitch` | musicnote |
| 701 | `#voiceRate` | `textInput: morseVoice.voiceRate` | speedometer |
| 715 | `#voiceBufferMaxLength` | `textInput: morseVoice.voiceBufferMaxLength` (Voice After) | bookshelf |

(Commented-out: speakFirstRepeats, smoothing/RiseK/DecayK blocks — keep out of React.)

### 2.7 Tone Options accordion (lines 772–813) — collapsed
Header `#toneSettingsAccordionButton`; icon `musicnoteImage`. `fieldset.morse-settings-fieldset` `input-group flex-wrap`:
| Ln | id | Binding | Classes |
|---|---|---|---|
| 789 | `#ditFrequency` | `textInput: settings.frequency.ditFrequency` | `form-control morse-settings-num morse-settings-num--wide` |
| 794 | `span` sync freq | `click: ()=>settings.frequency.syncFreq(!syncFreq())` ; icon lock/unlock | `input-group-text` |
| 800 | `#dahFrequency` | `textInput: settings.frequency.dahFrequency, enable:!syncFreq()` | `…--wide` |
| 805 | `button#zeroBeatButton` | `click: () => testTone()` | `btn btn-light` |

### 2.8 Input Options accordion (lines 815–871) — collapsed
Header `#customInputAccordionButton`; icon `uploadImage`. Body `accordion-body d-flex flex-column gap-3`.
**Practice text** fieldset (`settings-lesson-control-strip custom-input-actions`):
| Ln | id | Binding |
|---|---|---|
| 831 | `#btncheckshowraw` | `checked: showRaw` ; label icon eye/eyeslash ; `text: showRaw()?'Hide text':'View text'` |
| 841 | `button#btnClearText` | `click: doClear` ; icon trashImage |
| 849 | `button#btnLoadTextFile` | `onclick=…txtfiletoread.click()` ; icon arrowleftImage |
| 855 | `input[type=file]#txtfiletoread` | `event:{change: inputFileChange($element)}` |
| 863 | `textarea` | `textInput: showingText` (`working-text-area`), wrapper `custom-input-editor visible: showRaw` |
| 867 | `div` | `component:{name:'flaggedwordsaccordion', params:{root:$root}}` |

### 2.9 Output Options accordion (lines 873–945) — collapsed
Header `#outputSettingsAccordionButton`; icon `grid3x3gapImage`. `fieldset` `d-flex flex-column gap-2`, row `input-group flex-wrap align-items-center`:
| Ln | id | Binding | Icon | Classes |
|---|---|---|---|---|
| 891 | `#preSpace` | `textInput: preSpace` | volumemute | `…--wide` |
| 897 | `#xtraWordSpaceDits` | `textInput: xtraWordSpaceDits` | graphuparrow | `morse-settings-num` |
| 906 | `#cardSpace` | `textInput: cardSpace` | graphuparrow | `morse-settings-num` |
| 915 | `#cardFontPx` | `textInput: cardFontPx` | barchart | `…--wide` |
| 920 | `#btncheckcardsvisible` | `checked: cardsVisible` | grid3x3gap + check/circle | btn-check |
| 933 | `button` Audio File | `click: doDownload` | downloadImage | `btn btn-success` |
| 939 | `a#downloadLink` | (programmatic href) | — | — |
Actions row: `d-flex flex-wrap gap-2 align-items-center output-settings-actions`.

### 2.10 RSS + Noise component slots (lines 947–957)
- 948–950 `<!-- ko if: rss.rssEnabled() -->` → `div.accordion-item` `component:{name:'rssaccordion', params:{root:$root}}`
- 953–956 `<!-- ko if: noiseEnabled() -->` → `div.accordion-item` `component:{name:'noiseaccordion', params:{root:$root}}`

### 2.11 Working-text stats (lines 963–985) — `section.working-text-section`
`working-text-layout` / `working-text-stats aria-live="polite"` / `working-text-stat-row`:
| Ln | Binding |
|---|---|
| 971 | icon `stopwatchImage` |
| 972 | `text: playingTime().minutes` `:` `text: playingTime().normedSeconds` |
| 979 | `text: charsPlayed()` `/` `text: rawTextCharCount()` |

### 2.12 Playback controls (lines 987–1057) — `section.playback-controls`
Outer `d-flex flex-wrap gap-2 align-items-center w-100`. Three `btn-group`:
| Ln | Element | Binding | Classes |
|---|---|---|---|
| 992 | `button#btnPlayButton` | `click: () => doPlay(false,true)` | `btn btn-success` |
| 994 | span | `visible: !playerPlaying()` ('Play') | — |
| 996–998 | span | `visible: playerPlaying()`, `text: playingTime().minutes/.normedSeconds` | — |
| 1010 | span.spinner-border | `visible: playerPlaying` | `spinner-border spinner-border-sm` |
| 1013 | `img#playImage` | `visible: !playerPlaying()` | — |
| 1015 | `button#btnPause` | `click: () => {isPaused()? doPlay(true,false): doPause(false,true)}` | `btn btn-info` |
| 1017 | span.spinner-grow | `visible: isPaused` | `spinner-grow spinner-grow-sm text-dark` |
| 1020 | `img#pauseImage` | `visible: !isPaused()` | — |
| 1022 | `button#btnStop` | `click: () => doPause(true,false,true)` | `btn btn-danger` |
| 1028 | `input#btnHideList` | `checked: hideList` | btn-check |
| 1030 | label | icon `eyeImage/eyeslashImage` on `!hideList()` | `btn btn-outline-primary` |
| 1038 | `button#btnShuffle` | `click: () => shuffleWords(false)`, `text: isShuffled()?'UnShuffle':'Shuffle'` | `btn btn-secondary` |
| 1043 | `button#btnLoop` | `click: () => toggleLoop()`, `text: !loop()?'Loop Off': !loopnoshuffle()?'Loop Shuffle':'Loop On'`, icon arrowrepeat | `btn btn-secondary` |
| 1049 | `button#btnmanualvoice` | `click: () => speakVoiceBuffer()`, `visible: morseVoice.manualVoice() && morseVoice.voiceEnabled()`, icon bootstrapReboot | `btn btn-info` |

### 2.13 Card / word list (lines 1060–1075) — `section.col`
- 1062 `section` `if: cardsVisible`
- 1064 `div.row.gx-2.gy-2` `foreach: words`
- 1066–1067 `button.btn` **dynamic class** (THE key card binding — preserve exactly):
  `attr:{'aria-selected': $index()==$parent.currentIndex()?'true':'false'}`,
  `class: $index()==currentIndex() ? ($index()==words().length-1?'btn-danger':'btn-primary') : ($index()==words().length-1?'btn-outline-danger':'btn-outline-primary')`,
  `click:()=>$parent.flaggedWords.addFlaggedWord($data)`,
  `event:{dblclick: ()=>$parent.setWordIndex($index())}`
- 1068–1069 `span` `style:{fontSize:$parent.cardFontPx}`, `text:` reveal/obscure logic (hideList / trailReveal / maxRevealedTrail → real word or `'X'.repeat(len)`)

### 2.14 Help footer (lines 1077–1127) — `footer#page-help-footer`
- 1080 `details#keyboard-shortcuts` `page-help-shortcuts mb-4`
- 1085 `table.table.table-sm.table-striped.page-help-shortcuts-table`
- 1092 `tbody` `foreach: allShortcutKeys`; rows bind `text: $data.key` / `text: $data.title`
- 1104 `p#contributor-info.page-help-contributors` (call signs only)
- 1117 `p.warning` `if: isDev()` (BETA notice)
- 1119 `p#version-info` "Version 2.0"
- legal notice `page-legal-notice`

### 2.15 A11y live region (lines 1130–1132)
`<status class="sr-only" aria-live="polite">` → `p` `text: accessibilityAnnouncement()`.

### 2.16 KO component templates (not in `template.html` body)

**`simpleImageTemplate.html`** — used by `<simpleimage>` in speed bar (line 75):
| Element | Bindings | Classes |
|---|---|---|
| `img` | `attr:{ src, height, width }` | inline `vertical-align: middle` |

**`flaggedWordsAccordion.html`** — `component: flaggedwordsaccordion` (line 867):
| Ln | Element | Bindings | Classes |
|---|---|---|---|
| 7 | `span.badge` | `text: flaggedWords.flaggedWordsCount` | `badge bg-success ms-1` |
| 10 | `button#btnSetFlagged` | `click: setFlagged` ; img `attr:{src: uploadImage}` | `input-group-text` |
| 14 | `button#btnClearFlagged` | `click: clearFlagged` ; img `attr:{src: trashImage}` | `input-group-text` |
| 16 | `textarea` | `textInput: flaggedWords.flaggedWords` | `form-control` |

Wrapper: `fieldset.morse-settings-fieldset.morse-settings-subfieldset`, `legend`, `p.form-text`, `div.input-group.flagged-cards-input-group`.

**`rssAccordion.html`** — `component: rssaccordion` when `rss.rssEnabled()` (line 949):
| Ln | Element | Bindings | Classes |
|---|---|---|---|
| 6 | `img` | `attr:{src: rssImage}` | — |
| 9 | `span.badge` | `class: rssPollingOn?'bg-success':'bg-danger', text: poll text` | `badge` |
| 10 | `span.badge.bg-success` | `text: 'Unread:' + unreadRssCount()` | — |
| 12 | `span.badge` | `class: rssPlayOn?'bg-success':'bg-danger', text: play status` | — |
| 22 | `input` RSS URL | `textInput: rss.rssFeedUrl` | `form-control` |
| 25 | `input` Proxy | `textInput: rss.proxydUrl` | `form-control` |
| 36 | `input` Poll mins | `textInput: rss.rssPollMins` | `form-control` |
| 40 | `input` Play mins | `textInput: rss.rssPlayMins` | `form-control` |
| 47 | `button` | `text: rss.pollRssButtonText, click: rss.doRSS` | `btn btn-success` |
| 49 | `button` | `text: rss.playRssButtonText, click: rss.doRssPlay` | `btn btn-secondary` |
| 50 | `button` | `click: rss.doRSSReset` | `btn btn-danger` |

Uses fork class **`input-group-vertical`** (not Bootstrap).

**`noiseAccordion.html`** — `component: noiseaccordion` when `noiseEnabled()` (line 955):
| Ln | Element | Bindings | Classes |
|---|---|---|---|
| 7 | header `img` | `attr:{src: soundwaveImage}` | — |
| 17–29 | radio `noiseType` | `checked: noiseType` values `off/white/brown/pink` | `btn-check` + labels `btn-outline-primary/info/secondary/danger` |
| 39 | `#noiseVolume` | `textInput: noiseVolume` | `form-control` |

---

## 3. Every `ko.observable` / `ko.computed` (state inventory)

### 3.1 `MorseViewModel` (`src/morse/morse.ts`)
**Observables:** `accessibilityAnnouncement`, `textBuffer`, `hideList`(true), `currentIndex`(0), `playerPlaying`(false), `lastFullPlayTime`, `preSpace`(0), `preSpaceUsed`(false), `xtraWordSpaceDits`(0), `isShuffled`(false), `trailReveal`(false), `rawText`(''), `showingText`(''), `showRaw`(true→set false in ctor), `darkMode`(false), `volume`(0), `noiseHidden`(true), `noiseEnabled`(false), `noiseVolume`(2), `noiseType`('off'), `runningPlayMs`(0), `lastPartialPlayStart`, `isPaused`(false), `morseLoadImages`, `showExpertSettings`(false), `cardFontPx`, `loop`(false), `loopnoshuffle`(false), `cardsVisible`(true), `trailPreDelay`(0), `trailPostDelay`(0), `trailFinal`(1), `maxRevealedTrail`(-1), `isDev`(false), `riseTimeConstant`(0.001), `decayTimeConstant`(0.001), `riseMsOffset`(1.5), `decayMsOffset`(1.5), `smoothing`(true), `morseDisabled`(false), `charsPlayed`(0), `cardSpace`(0), `allowSaveCookies`(true), `numberOfRepeats`(0), `shuffleIntraGroup`(false).
**observableArray:** `allShortcutKeys`.
**computed:** `applyEnabled`, `words` (→`WordInfo[]` via `MorseStringUtils.getWords`), `rawTextCharCount`, `timeEstimate`, `playingTime` (→`PlayingTimeInfo`).

### 3.2 `SpeedSettings` (`settings/speedSettings.ts`)
obs: `trueWpm`, `trueFwpm`, `syncWpm`(true), `speedInterval`(false), `intervalTimingsText`(''), `intervalWpmText`(''), `intervalFwpmText`(''), `vWpm`(0), `vFwpm`(0).
pureComputed (read/write w/ Farnsworth coupling): `wpm`, `fwpm`. computed: `variableSpeedDisplay`.
cookies: `wpm`, `fwpm`, `syncWpm`.

### 3.3 `FrequencySettings` (`settings/frequencySettings.ts`)
obs: `trudDitFrequency`, `truDahFrequency`, `syncFreq`(true). pureComputed: `ditFrequency`, `dahFrequency` (dah mirrors dit when synced). cookies: `ditFrequency`, `dahFrequency`, `syncFreq`.

### 3.4 `MiscSettings` (`settings/miscSettings.ts`)
obs: `newlineChunking`(false).

### 3.5 `MorseLessonPlugin` (`lessons/morseLessonPlugin.ts`)
obs: `autoCloseLessonAccordion`(false, cookie `autoCloseLessonAccordian`), `userTarget`('STUDENT'), `selectedClass`('' + `classOrLetterGroupChange` extender), `letterGroup`('' + same extender), `selectedDisplay`({}), `selectedSettingsPreset`(dummy), `lastSelectedSettingsPreset`(dummy), `settingsOverridden`(false), `ifStickySets`(false), `stickySets`(''), `randomizeLessons`(true), `ifOverrideTime`(false), `overrideMins`(2), `ifCustomGroup`(false), `customGroup`(''), `ifOverrideMinMax`(false), `trueOverrideMin`(3), `trueOverrideMax`(3), `syncSize`(true).
observableArray: `wordLists` (`FileOptionsInfo[]`), `settingsPresets` (`SettingsOption[]`).
pureComputed: `overrideMin`, `overrideMax` (sync-coupled). computed: `userTargets`, `classes`, `letterGroups`, `displays` (cascading filters off `wordLists`). Cascade resets via `.subscribe` in `setupLessonPickerCascade`.

### 3.6 `MorseVoice` (`voice/MorseVoice.ts`)
obs: `voiceEnabled`(false, extender `turnOffSpeakFirstWithVoiceOff`), `voiceCapable`(false), `voiceThinkingTime`(0), `voiceAfterThinkingTime`(0), `voiceVoiceIdx`(-1), `voiceVolume`(10), `voiceRate`(1), `voicePitch`(1), `voiceLang`('en-us'), `voiceBufferMaxLength`(1), `voiceSpelling`(true), `voiceLastOnly`(false), `manualVoice`(false), `speakFirst`(false), `speakFirstRepeats`(0), `speakFirstAdditionalWordspaces`(0), `voiceVoiceName`(null, cookie).
observableArray: `voiceVoices`. computed: `voiceVoice` (idx→voice, sets name), `voiceThinkingTimeWpm` (3.6/vtt).
Non-observable buffer: `voiceBuffer: VoiceBufferInfo[]`.

### 3.7 `MorseRssPlugin` (`rss/morseRssPlugin.ts`)
obs(cookie): `rssFeedUrl`, `proxydUrl`, `rssPlayMins`(5), `rssPollMins`(5). obs: `rssPlayOn`(false), `lastRSSPoll`, `rssMinsToWait`(-1), `rssPollMinsToWait`(-1), `rssPollingOn`(false), `rssPolling`(false), `rssPlayWaitingBadgeText`(''), `rssEnabled`(false). observableArray: `rssTitlesQueue` (`RssTitle[]`). computed: `unreadRssCount`, `playRssButtonText`, `pollRssButtonText`.

### 3.8 `FlaggedWords` (`flaggedWords/flaggedWords.ts`)
obs: `flaggedWords`(''). computed: `flaggedWordsCount`.

### 3.9 Custom KO extenders (`koextenders/morseExtenders.ts`) — must become React effects/middleware
`saveCookie` (persist to cookie when `allowSaveCookies`), `showingChange`, `showRawChange`, `setVolume` (→`morseWordPlayer.setVolume`), `setNoiseVolume`, `setNoiseType`, `undoIsShuffled`, `dummyLogger`, `sWakeLock` (→`screenWakeLock`). Plus lesson `classOrLetterGroupChange` and voice `turnOffSpeakFirstWithVoiceOff`.
Applied in `MorseExtenders.apply`: `hideList`, `showingText`, `showRaw`, `preSpace`, `xtraWordSpaceDits`, `volume`, `noiseVolume`, `noiseType`, `showExpertSettings`, `cardFontPx`, `darkMode` (all `saveCookie`), plus `rawText`(`undoIsShuffled`), `playerPlaying`(`sWakeLock`).

---

## 4. Audio / tone generation — **port to `morseScheduler.ts`, never `setTimeout`**

### 4.1 Façade
`MorseWordPlayer` (`player/morseWordPlayer.ts`) selects an `ISoundMaker`:
- `setSoundMaker(smoothing)` → **`SmoothedSoundsPlayer`** (smoothing on, the default; `smoothing` obs defaults true) **or** `MorseWavBufferPlayer` (off).
- API surface: `play(config,onEnded)`, `pause(cb,killNoise)`, `setVolume`, `setNoiseVolume`, `setNoiseType`, `getWavAndSample` (download), `getTimeEstimate`.

### 4.2 Tone-generation points — `SmoothedSoundsPlayer` (live Web Audio) **[PRIMARY PATH]**
File: `player/soundmakers/SmoothedSounds/SmoothedSoundsPlayer.ts` + `SmoothedSoundsContext.ts`.

**`SmoothedSoundsContext` node graph (the real oscillator):**
- `getAudioContext()` — `new AudioContext()` live, or `new OfflineAudioContext(2, 44100*durMs/1000, 44100)` for download. *(SSP line 55)*
- `getOscillatorNode()` — **`audioContext.createOscillator()`, `type='sine'`** *(line 33–34)* ← **TONE SOURCE**
- `getBandPassNode()` — `createBiquadFilter()` type `bandpass`, `Q=1` *(line 38–40)*
- `getGainNode()` — `createGain()` *(line 28)*
- `connectNodes()` — oscillator → gain → bandpass → destination *(line 44–46)*
- `startOscillatorSilenced()` — gain 0 then `oscillatorNode.start(currentTime)` *(line 50–51)*
- `stopAndCloseContext()` — `oscillatorNode.stop()` + `audioContext.close()` *(line 59–77)*

**Scheduling — `setGainTimings()` (SSP line 91–122):** iterates `wavInfo.timeLine` events; per event:
- `prepad_start` → `gainNode.gain.setValueAtTime(0, time)`
- `dah_start`/`dit_start` → `oscillatorNode.frequency.setValueAtTime(ditFreq|dahFreq, riseTimeTarget)`, same on `bandpassNode.frequency`, then **`gainNode.gain.setTargetAtTime(scaledVolume, riseTimeTarget, riseTimeConstant)`**
- `dah_end`/`dit_end` → `gainNode.gain.setTargetAtTime(0, endTime/1000 - decayMsOffset/1000, decayTimeConstant)`
→ **These are sample-accurate Web Audio AudioParam schedules. In React they MUST stay on the AudioContext clock (`currentTime` + `setTargetAtTime`/`setValueAtTime`), i.e. `morseScheduler.ts`. Do NOT re-implement with `setTimeout`.**

**End-of-play (SSP `doPlay` line 130–164):** live path currently uses `setTimeout(closeOut, endTime)` (line 150) to fire `onEnded` — **this is the timer that must be replaced by AudioContext-based scheduling in `morseScheduler.ts`.** Offline path schedules `oscillatorNode.stop(endTime/1000)` then `startRendering()`.
`getEndTime()` (line 197) computes from timeline + word-space.

### 4.3 Tone-generation points — `MorseWavBufferPlayer` (decoded PCM) **[SECONDARY/legacy path, smoothing off]**
File: `player/soundmakers/WavBufferPlayer/morseWavBufferPlayer.ts`.
- `play()` → `MorseStringToWavBuffer.createWav(config, true)` builds a **WAV byte buffer of pre-rendered sine samples**.
- `doPlay()` → `new AudioContext()`, `createGain()`, `createBufferSource()`, `decodeAudioData(mybuf, …)`, then `source.start(0)`. `ended` event fires `onEnded`. ← tone playback via decoded buffer (no setTimeout for end; uses `ended` event — good model).

### 4.4 Sample/WAV synthesis (the math behind the samples)
- `MorseStringToWavBuffer` (`player/wav/morseStringToWavBuffer.ts`): `getInit()` builds **`MorseCWWave(useProsigns, wpm, fwpm, {dit,dah}, sampleRate=8000)`** (`src/morse-pro/morse-pro-cw-wave.js`), `translate(word)`. `createWav()` → `morseCWWave.getSample(singleWordSpaceTime, prePaddingMs)` + `RiffWave.getData(sample)` (`morse-pro/morse-pro-util-riffwave.js`). `estimatePlayTime()` returns timing for the Play/estimate UI.
- **Timeline generator (drives `setGainTimings`)** — `MorseTimingCalculator.getTimeLine()` (`timing/morseTimingCalculator.ts`): emits events `prepad_start/end`, `wordspace_start/end`, `intrachar_start/end`, `dit_start/end`, `dah_start/end`, `interchar_start/end` with cumulative `time` (ms). Multipliers in `UnitTimingsAndMultipliers` (`timing/UnitTimingsAndMultipliers.ts`): dit×1, dah×3, intra-char×1, inter-char×3, word-space×7; `calculatedUnitsMs = 60/(50*wpm)*1000`, Farnsworth `calculatedFWUnitsMs = ((60/fwpm) - 31*ditSec)/19 *1000`.
- `SoundMakerConfig` (`player/soundmakers/SoundMakerConfig.ts`): all per-play params — `word, wpm, fwpm, ditFrequency, dahFrequency, prePaddingMs, xtraWordSpaceDits, volume, noise, playerPlaying, riseTimeConstant, decayTimeConstant, riseMsOffset, decayMsOffset, offline, trimLastWordSpace, morseDisabled, voiceEnabled, isToneTest, testToneDuration(10000)`. Built by `MorseViewModel.getMorseStringToWavBufferConfig`.

### 4.5 Noise generation (both soundmakers)
`startNoise(config)` dynamically `import()`s `white-noise-node` / `brown-noise-node` / `pink-noise-node`, `def.install()`, creates `createWhiteNoise|createBrownNoise|createPinkNoise()`, routes node → `noiseGainNode` → destination, `.start()`. `handleNoiseSettings` toggles based on `config.noise.type` ('off'|'white'|'brown'|'pink') and `playerPlaying`. `NoiseConfig` (`player/soundmakers/NoiseConfig.ts`).

### 4.6 Test tone & download (entry points)
- `testTone()` (morse.ts 430) — plays sustained 'T' tone (`isToneTest=true`, 10 s) via the soundmaker; toggles off on 2nd click. **Uses `setTimeout(…,10000)` to flip flag** — candidate for scheduler port.
- `doDownload()` (morse.ts 885) — `getWavAndSample()` → offline render → `Blob` `audio/wav` → `#downloadLink` click.

### 4.7 ⚠️ `setTimeout` usage that the React port must reconcile with `morseScheduler.ts`
These exist in KO and govern *gameplay pacing* (not tone scheduling). Audio **tone** scheduling must move to the AudioContext clock, but these pacing timers control card advance / voice "thinking time" / trail reveal:
- `morse.ts`: `doPlay` inter-card delay (`setTimeout … 0|1000`, line 524/578), `decrementIndex` 1000 ms (355), `cardSpaceTimerHandle` (677), voice think-time delays (563, 723), trail pre/post/final delays (`playEnded` 631/633/647), `testTone` 10 s (440), EasySpeech init 5 s (158).
- `SmoothedSoundsPlayer.doPlay` end-of-tone `setTimeout(endTime)` (150) — **the one to replace with scheduler.**
- `MorseVoice.speakPhrase` after-think-time delay (269).
- `MorseRssPlugin` polling timers.

### 4.8 morse-pro engine files (`src/morse-pro/`) — legacy library
Used by current code: **`morse-pro-cw-wave.js`** (sample synth) and **`morse-pro-util-riffwave.js`** (WAV bytes). Present but **not wired into the active soundmakers**: `morse-pro-player-waa.js`, `-waa-light.js`, `-player-xas.js`, `-keyer*`, `-listener*`, `-decoder*`, `-cw.js`, `-message.js`, `-wpm.js`, `-util-datauri.js`. (Confirm before porting; the React app only needs cw-wave + riffwave for the buffer path, and pure Web Audio for the smoothed path.)

---

## 5. Bootstrap classes used (preserve EXACTLY in React)

### 5.1 Bootstrap 5 classes (from `template.html` + 4 component templates)
**Grid/layout:** `container-fluid`, `row`, `col`, `col-auto`, `col-6`, `col-12`, `col-md-auto`, `col-md-4`, `col-lg`, `g-2`, `g-3`, `gx-2`, `gy-2`, `gy-3`, `gap-1`, `gap-2`, `gap-3`, `row-cols-1`, `row-cols-2`, `row-cols-3`, `row-cols-5`, `w-100`.
**Flex/spacing utils:** `d-flex`, `flex-column`, `flex-md-row`, `flex-wrap`, `align-items-center`, `align-items-start`, `justify-content-center`, `justify-content-md-start`, `mb-0`, `mb-2`, `mb-3`, `mb-4`, `ms-1`, `text-center`, `text-md-start`, `text-dark`.
**Buttons:** `btn`, `btn-sm`, `btn-primary`, `btn-secondary`, `btn-success`, `btn-danger`, `btn-info`, `btn-light`, `btn-outline-primary`, `btn-outline-secondary`, `btn-outline-info`, `btn-outline-danger`, `btn-check`, `btn-group`, `btn-toolbar`.
**Forms:** `form-control`, `form-select`, `form-text`, `input-group`, `input-group-text`.
**Accordion:** `accordion`, `accordion-item`, `accordion-header`, `accordion-button`, `accordion-collapse`, `accordion-body`, `collapse`, `show`, `collapsed`.
**Dropdown:** `dropdown`, `dropdown-toggle`, `dropdown-menu`, `dropdown-item`.
**Components:** `badge`, `bg-success`, `bg-danger`, `spinner-border`, `spinner-border-sm`, `spinner-grow`, `spinner-grow-sm`, `table`, `table-sm`, `table-striped`.
**Typography/state:** `h5`, `h6`, `active`, `warning`, `sr-only`.
**Bootstrap data attrs (behavior, must be replicated):** `data-bs-toggle="collapse"`, `data-bs-target`, `data-bs-toggle="dropdown"`, `aria-expanded`, `aria-controls`, `aria-labelledby`, `aria-pressed`, `aria-checked`, `aria-selected`, `role` (`group`, `toolbar`, `status`, `listbox`, `option`, `presentation`, `checkbox`, `note`, `text`).

> ⚠️ **`input-group-vertical`** (rssAccordion.html lines 20, 31) is **NOT a Bootstrap class** — it's a fork custom class. Preserve as-is.

### 5.2 Fork custom CSS classes (in `src/css/style.css`) — **the fork's UI, preserve EXACTLY**
`page-container`, `page-header`, `page-title`, `site-logo`, `theme-toggle-btn`, `theme-icon`,
`speed-settings-section`, `speed-input-group`, `speed-volume-segment`, `speed-interval-input-group`,
`morse-settings-num`, `morse-settings-num--wide`, `morse-settings-text-short`, `morse-settings-text-interval`,
`settings-group-accordion`, `settings-group-panel`, `settings-lesson-options-panel`,
`morse-settings-fieldset`, `morse-settings-subfieldset`, `morse-settings-legend`,
`settings-lesson-control-strip`, `settings-lesson-control`, `settings-inline-row`,
`lesson-selection-badge`, `lessons-picker-row`, `lessons-picker-col`, `lessons-picker-label`, `lessons-picker-dropdown`, `lessons-preset-actions`,
`trail-settings-row`, `custom-input-actions`, `custom-input-editor`, `working-text-area`,
`working-text-section`, `working-text-layout`, `working-text-stats`, `working-text-stat-row`, `working-text-stat-label`, `working-text-stat-value`,
`playback-controls`, `flagged-cards-input-group`, `output-settings-actions`,
`page-help-footer`, `page-help-shortcuts`, `page-help-shortcuts-intro`, `page-help-shortcuts-table`, `page-help-links`, `page-help-contributors`, `page-help-link-list`, `page-help-version`, `page-legal-notice`, `key`, `function`, `input-group-vertical`.

(Confirm the exact selectors against `src/css/style.css` during the React port; they carry the fork's spacing/sizing that the brief says must be preserved.)

---

## 6. Lesson / word files

### 6.1 `src/wordfiles/` — 634 files total
- **400 `.txt`** word/phrase lesson files.
- **234 `.json`** companion config files.
Naming convention groups by curriculum: `ADV1/ADV2/ADV3*`, `BC1/BC2/BC3*`, `INT1/INT2/INT3*`, `POL*`, plus `*_1Words_NN`, `*_2Words`, `*_FAM_Phrases`, `*_FAM_Sentences`, `*_SEN_*`, `*_Fam_Phrases_QSO`, etc. (e.g. `ADV1_1Words_01.txt`, `ADV1_FAM_Phrases_2W.txt`, `ADV1_SEN_4W.txt`).
Index/manifest: **`src/wordfilesconfigs/wordlists.json`** (large; consumed by `morseLessonPlugin.ts` via `WordListsJson` → builds `wordLists`/`FileOptionsInfo`, which drive the TYPE/CLASS/CONTENT/LESSON cascade computeds).
> Stray: `srd/wordfiles/IB2599.txt` (single file, likely typo dir — not the corpus).

### 6.2 Presets (`src/presets/`) — drive the PRESETS picker
- `src/presets/config.json` — master class→preset map (`ClassPresets`).
- `src/presets/configs/*.json` — **~209 individual preset config files** (e.g. `BC1_Default.json`, `ICR+_20.json`, `POL_Random_27.json`, `suduko12.json`).
- `src/presets/sets/*.json` — 12 preset *sets* (`ADV1/2/3`, `bc1/2/3`, `INT1/2/3`, `POL`, `TTR+`).
- `src/presets/overrides/presetoverrides.json` (`SettingsOverridesJson`).
- `src/presets/legacymixin/legacymixin.json` (`LegacyMixinJson`).

### 6.3 Other config inputs
- `src/configs/licwdefaults.json` — default settings (incl. `darkMode`).
- `src/configs/wordify.json` — punctuation→words for voice.
- Generated finders (gitignored): `morseLessonFinder.js`, `morsePresetFinder.js`, `morsePresetSetFinder.js`.

### 6.4 `srd/wordfiles/` (brief path — not the corpus)
Only **`IB2599.txt`** (stray duplicate; real file is `src/wordfiles/SB2599.json` + related IB/SB259* set).

### 6.5 Complete file inventory — `src/wordfiles/` (634 files)

400 `.txt` + 234 `.json`. Alphabetical basenames from `rdreed21/morsebrowser_dev` `develop` branch:

```
ADV1_1Words_01.txt
ADV1_1Words_02.txt
ADV1_1Words_03.txt
ADV1_1Words_04.txt
ADV1_1Words_05.txt
ADV1_1Words_06.txt
ADV1_1Words_07.txt
ADV1_1Words_08.txt
ADV1_1Words_09.txt
ADV1_1Words_10.txt
ADV1_2Words.txt
ADV1_FAM_Phrases_2W.txt
ADV1_Fam_Phrases_4L.txt
ADV1_Fam_Phrases_QSO.txt
ADV1_FAM_Sentences_4W.txt
ADV1_FAM_Sentences_5W.txt
ADV1_SEN_4W.txt
ADV1_SEN_5W.txt
ADV2_1Words_01.txt
ADV2_1Words_02.txt
ADV2_1Words_03.txt
ADV2_1Words_04.txt
ADV2_1Words_05.txt
ADV2_1Words_06.txt
ADV2_1Words_07.txt
ADV2_1Words_08.txt
ADV2_1Words_09.txt
ADV2_1Words_10.txt
ADV2_2Words.txt
ADV2_Fam_Phrases_4L.txt
ADV2_Fam_Phrases_QSO.txt
ADV2_FAM_Sentences_5W.txt
ADV2_FAM_Sentences_6W.txt
ADV2_SEN_5W.txt
ADV2_SEN_6W.txt
ADV3_Fam_Phrases_4L.txt
ADV3_Fam_Phrases_QSO.txt
ADV3_FAM_Sentences_6W.txt
ADV3_FAM_Sentences_7W.txt
ADV3_SEN_6W.txt
ADV3_SEN_7W.txt
ALL.json
B1.json
B1B2.json
B2_PRO_1W.txt
B2_PRO_2W.txt
B2_PRO_QSO.txt
B2.json
BC1_FAM_HOF.txt
BC1_FAM_LCD.txt
BC1_FAM_PSG.txt
BC1_FAM_REA.txt
BC1_FAM_TIN.txt
BC1_FAM_UWB.txt
BC1_P_Eval_G3.txt
BC1_P_Eval_S.txt
BC1_P_Eval_W.txt
BC2_16_W.txt
BC2_28_W.txt
BC2_40_W.txt
BC2_59_W.txt
BC2_73_W.txt
BC2_FAM_16.txt
BC2_FAM_28BK.txt
BC2_FAM_40.txt
BC2_FAM_59.txt
BC2_FAM_73.txt
BC2_FAM_KMY.txt
BC2_FAM_Prosigns.txt
BC2_FAM_QXV.txt
BC2_FAM_ZJ.txt
BC2_KMY_W.txt
BC2_P_Eval_Sent.txt
BC2_P_Eval_Words.txt
BC2_P-Eval_CS.txt
BC2_PS_W.txt
BC2_QXV_W.txt
BC2_ZJ_W.txt
BC3_ARRL_Sections.txt
BC3_Fam_Contest1.txt
BC3_Fam_Contest2.txt
BC3_FD_Exch_Full_Name.txt
BC3_FD_Exch.txt
BC3_Phrases_Field_Day.txt
BC3_Phrases_K1USN_SST.txt
BC3_Phrases_LICW.txt
BC3_Phrases_SKCC_WES.txt
BC3_Phrases_SOTA.txt
Bug_L.json
Bug_LN..json
Bug_LNP.json
Bug_N.json
Bug_P.json
Com_test.json
Fam_Abbrev_Extended.txt
Fam_Abbrev.txt
Fam_L.json
Fam_LN.json
Fam_LNP.json
Fam_N.json
Fam_Punc._PS.txt
Fam_Q.txt
Fam_Words - 1.txt
Fam_Words - 2.txt
Fam_Words - 3.txt
Fam_Words - 4.txt
HOF10.txt
HOF11.txt
HOF8.txt
HOF9.txt
IB1HOF1.json
IB1HOF2.json
IB1HOF3.json
IB1HOF4.json
IB1HOF5.json
IB1HOF6.json
IB1HOF7.json
IB1LCD1.json
IB1LCD2.json
IB1LCD3.json
IB1LCD4.json
IB1LCD5.json
IB1LCD6.json
IB1LCD7.json
IB1PG20.json
IB1PGS1.json
IB1PGS2.json
IB1PGS4.json
IB1PGS5.json
IB1PGS6.json
IB1PGS7.json
IB1REA1.json
IB1REA2.json
IB1REA3.json
IB1REA4.json
IB1REA5.json
IB1REA6.json
IB1REA7.json
IB1TIN1.json
IB1TIN2.json
IB1TIN3.json
IB1TIN4.json
IB1TIN5.json
IB1TIN6.json
IB1TIN7.json
IB1UWB1.json
IB1UWB2.json
IB1UWB3.json
IB1UWB4.json
IB1UWB5.json
IB1UWB6.json
IB1UWB7.json
IB2161.json
IB21610.json
IB2162.json
IB2163.json
IB2164.json
IB2165.json
IB2166.txt
IB2167.txt
IB2168.txt
IB228BK1.json
IB228BK10.json
IB228BK2.json
IB228BK3.json
IB228BK4.json
IB228BK5.json
IB228BK6.txt
IB228BK7.txt
IB228BK8.txt
IB2401.json
IB2402.json
IB2403.json
IB2404.txt
IB2405.txt
IB2406.txt
IB2408.json
IB2591.json
IB25910.json
IB2592.json
IB2593.json
IB2594.json
IB2595.json
IB2596.txt
IB2597.txt
IB2598.txt
IB2731.json
IB27310.json
IB2732.json
IB2733.json
IB2734.json
IB2735.json
IB2736.txt
IB2737.txt
IB2738.txt
IB2ARSKBT1.json
IB2ARSKBT2.json
IB2ARSKBT3.json
IB2ARSKBT4.json
IB2ARSKBT5.json
IB2ARSKBT6.txt
IB2ARSKBT7.txt
IB2ARSKBT9.json
IB2C1.json
IB2C2.txt
IB2C3.txt
IB2C4.txt
IB2C5.txt
IB2C6.txt
IB2C7.txt
IB2C8.txt
IB2KMY1.json
IB2KMY2.json
IB2KMY3.json
IB2KMY4.json
IB2KMY5.json
IB2KMY6.txt
IB2KMY7.txt
IB2KMY9.json
IB2QXV1.json
IB2QXV2.json
IB2QXV3.json
IB2QXV4.json
IB2QXV5.json
IB2QXV6.txt
IB2QXV7.txt
IB2QXV9.json
IB2ZJ1.json
IB2ZJ2.json
IB2ZJ3.json
IB2ZJ4.json
IB2ZJ5.json
IB2ZJ6.txt
IB2ZJ7.txt
IB2ZJ9.json
ICR1.json
ICR1.txt
ICR10.txt
ICR11.txt
ICR12.txt
ICR15.txt
ICR16.txt
ICR17.txt
ICR18.txt
ICR19.txt
ICR2.txt
ICR20.txt
ICR21.txt
ICR22.txt
ICR23.txt
ICR24.txt
ICR25.txt
ICR26.txt
ICR27.txt
ICR28.txt
ICR29.txt
ICR3.txt
ICR30.txt
ICR31.txt
ICR32.txt
ICR33.txt
ICR34.txt
ICR35.txt
ICR36.txt
ICR37.txt
ICR38.txt
ICR4.txt
ICR5.txt
ICR6.txt
ICR7.txt
ICR8.txt
ICR9.txt
INT1_1 Word_01.txt
INT1_1 Word_02.txt
INT1_1 Word_03.txt
INT1_1 Word_04.txt
INT1_1 Word_05.txt
INT1_1 Word_06.txt
INT1_1 Word_07.txt
INT1_1 Word_08.txt
INT1_1 Word_09.txt
INT1_1 Word_10.txt
INT1_2 Words.txt
INT1_Bi_1.txt
INT1_Bi_2.txt
INT1_Bi_3.txt
INT1_Bi_4.txt
INT1_Bi_5.txt
INT1_Bi_6.txt
INT1_Bi_7.txt
INT1_Fam_Phrases_2L.txt
INT1_Fam_Phrases_3L.txt
INT1_Fam_Phrases_QSO.txt
INT1_FAM_Sentences_2W.txt
INT1_FAM_Sentences_3W.txt
INT1_Protocal_1B.txt
INT1_Protocal_1C.txt
INT1_Protocal_2B.txt
INT1_Protocal_2C.txt
INT1_Protocal_3B.txt
INT1_Protocal_3C.txt
INT1_Protocal_4B.txt
INT1_Protocal_4C.txt
INT1_QSO1.txt
INT1_QSO2.txt
INT1_SEN_3W.txt
INT1.json
INT10.txt
INT13.txt
INT14.txt
INT2_1 Word_01.txt
INT2_1 Word_02.txt
INT2_1 Word_03.txt
INT2_1 Word_04.txt
INT2_1 Word_05.txt
INT2_1 Word_06.txt
INT2_1 Word_07.txt
INT2_1 Word_08.txt
INT2_1 Word_09.txt
INT2_1 Word_10.txt
INT2_2 Words.txt
INT2_Fam_Phrases_3L.txt
INT2_Fam_Phrases_4L.txt
INT2_Fam_Phrases_QSO.txt
INT2_FAM_Sentences_4W.txt
INT2_SEN_4W.txt
INT2.json
INT3_1 Word_01.txt
INT3_1 Word_02.txt
INT3_1 Word_03.txt
INT3_1 Word_04.txt
INT3_1 Word_05.txt
INT3_1 Word_06.txt
INT3_1 Word_07.txt
INT3_1 Word_08.txt
INT3_1 Word_09.txt
INT3_1 Word_10.txt
INT3_2 Words.txt
INT3_Fam_Phrases_3L.txt
INT3_Fam_Phrases_4L.txt
INT3_Fam_Phrases_QSO.txt
INT3_FAM_Sentences_5W.txt
INT3_SEN_5W.txt
INT3.json
INT4.json
INT5.json
INT6.txt
INT7.txt
INT8.json
INT9.txt
LCD10.txt
LCD11.txt
LCD8.txt
LCD9.txt
PGS10.txt
PGS11.txt
PGS8.txt
PGS9.txt
POL_100_W_Sentences_CVC.txt
POL_100_W_Sentences.txt
POL_2-3W_ALL.txt
POL_2-3W_Pt1.txt
POL_2-3W_Pt2.txt
POL_2-3W_Pt3.txt
POL_2-3W_Pt4.txt
POL_2W_ALL.txt
POL_2W_Phrases_Long.txt
POL_2WPhrases_Pt2.txt
POL_2WPhrases_Pt3.txt
POL_2WPhrases.txt
POL_3-4W_Head_Sending.txt
POL_3-4W_Pt1.txt
POL_3-4W_Pt2.txt
POL_3L_Words_Long.txt
POL_3W_Head_Sending_Phrases.txt
POL_3W_Pharase_Long.txt
POL_3W_Phrases_CVC.txt
POL_3W_Phrases_Pt1.txt
POL_3W_Phrases_Pt2.txt
POL_4-5W_Pt1.txt
POL_4-5W_Pt2.txt
POL_4L_Words_Long.txt
POL_4W_ALL.txt
POL_4W_Pt1.txt
POL_4W_Pt2.txt
POL_4W_Pt3.txt
POL_5-6W_Head_Sending.txt
POL_5W_ALL.txt
POL_5W_Pt1.txt
POL_5W_Pt2.txt
POL_5W_Pt3.txt
POL_7-8W_Head_Sending.txt
POL_ABLE.txt
POL_Bi_ALL.txt
POL_Bi_Pt1.txt
POL_Bi_Pt2.txt
POL_ED.txt
POL_ER.txt
POL_ES.txt
POL_EST.txt
POL_FUL.txt
POL_HOF_L.txt
POL_HOF_W.txt
POL_ING.txt
POL_IVE.txt
POL_Jokes.txt
POL_KMY_L.txt
POL_KMY_W.txt
POL_LCD_L.txt
POL_LCD_W.txt
POL_LESS.txt
POL_Letters_ALT.txt
POL_Letters.txt
POL_LY.txt
POL_MENT.txt
POL_NESS.txt
POL_Numbers_ALT.txt
POL_Numbers.txt
POL_OUS.txt
POL_PSG_L.txt
POL_PSG_W.txt
POL_QXV_L.txt
POL_QXV_W.txt
POL_REA_L.txt
POL_REA_W.txt
POL_S_Phrases_Pt1.txt
POL_S_Phrases_Pt2.txt
POL_Send_3-5_L_Words.txt
POL_Send_5-7_L_Words.txt
POL_SENDING_L.txt
POL_SENDING_L2.txt
POL_SENDING_N.txt
POL_SENDING_N2.txt
POL_SENDING_TRI.txt
POL_Sentences_CVC.txt
POL_Sentences.txt
POL_SUFFIXES.txt
POL_Test.txt
POL_TIN_L.txt
POL_TIN_W.txt
POL_TION.txt
POL_UWB_L.txt
POL_UWB_W.txt
POL_WB_ALL.txt
POL_WB_Pt1.txt
POL_WB_Pt2.txt
POL_WB_Pt3.txt
POL_ZJ_L.txt
POL_ZJ_W.txt
PREFIX.txt
REA10.txt
REA11.txt
REA8.txt
REA9.txt
SB1HOF1.json
SB1HOF2.json
SB1HOF3.json
SB1HOF4.json
SB1HOF5.json
SB1HOF6.json
SB1LCD1.json
SB1LCD2.json
SB1LCD3.json
SB1LCD4.json
SB1LCD5.json
SB1LCD6.json
SB1PGS1.json
SB1PGS2.json
SB1PGS3.json
SB1PGS4.json
SB1PGS5.json
SB1PGS6.json
SB1REA1.json
SB1REA2.json
SB1REA3.json
SB1REA4.json
SB1REA5.json
SB1REA6.json
SB1TIN1.json
SB1TIN2.json
SB1TIN3.json
SB1TIN4.json
SB1TIN5.json
SB1TIN6.json
SB1UWB1.json
SB1UWB2.json
SB1UWB3.json
SB1UWB4.json
SB1UWB5.json
SB1UWB6.json
SB21610.json
SB21611.json
SB21612.json
SB21613.json
SB21614.json
SB2162.json
SB2163.txt
SB2164.txt
SB2165.txt
SB2166.txt
SB2167.json
SB2168.json
SB2169.json
SB228BK10.json
SB228BK11.json
SB228BK12.json
SB228BK13.json
SB228BK14.json
SB228BK2.json
SB228BK3.txt
SB228BK4.txt
SB228BK5.txt
SB228BK6.txt
SB228BK7.json
SB228BK8.json
SB228BK9.json
SB24010.json
SB24011.json
SB24012.json
SB24013.json
SB24014.json
SB2402.json
SB2403.txt
SB2404.txt
SB2405.txt
SB2406.txt
SB2407.json
SB2408.json
SB2409.json
SB25910.json
SB25911.json
SB25912.json
SB25913.json
SB25914.json
SB2592.json
SB2593.txt
SB2594.txt
SB2595.txt
SB2596.txt
SB2597.json
SB2598.json
SB2599.json
SB27310.json
SB27311.json
SB27312.json
SB27313.json
SB27314.json
SB2732.json
SB2733.txt
SB2734.txt
SB2735.txt
SB2736.txt
SB2737.json
SB2738.json
SB2739.json
SB2ARSKBT10.json
SB2ARSKBT11.json
SB2ARSKBT12.json
SB2ARSKBT13.json
SB2ARSKBT2.json
SB2ARSKBT3.txt
SB2ARSKBT4.txt
SB2ARSKBT5.txt
SB2ARSKBT6.json
SB2ARSKBT7.json
SB2ARSKBT8.json
SB2ARSKBT9.json
SB2C1.json
SB2C2.txt
SB2C3.txt
SB2C4.txt
SB2C5.txt
SB2C6.txt
SB2C7.txt
SB2C8.txt
SB2KMY10.json
SB2KMY11.json
SB2KMY12.json
SB2KMY13.json
SB2KMY2.json
SB2KMY3.txt
SB2KMY4.txt
SB2KMY5.txt
SB2KMY6.json
SB2KMY7.json
SB2KMY8.json
SB2KMY9.json
SB2QXV10.json
SB2QXV11.json
SB2QXV12.json
SB2QXV13.json
SB2QXV2.json
SB2QXV3.txt
SB2QXV4.txt
SB2QXV5.txt
SB2QXV6.json
SB2QXV7.json
SB2QXV8.json
SB2QXV9.json
SB2ZJ10.json
SB2ZJ11.json
SB2ZJ12.json
SB2ZJ13.json
SB2ZJ2.json
SB2ZJ3.txt
SB2ZJ4.txt
SB2ZJ5.txt
SB2ZJ6.json
SB2ZJ7.json
SB2ZJ8.json
SB2ZJ9.json
suduko1.txt
SUFFIX.txt
TIN10.txt
TIN11.txt
TIN8.txt
TIN9.txt
US_CS.txt
UWB10.txt
UWB11.txt
UWB8.txt
UWB9.txt
Words_10L.txt
Words_11L.txt
Words_12L.txt
Words_13L.txt
Words_14L.txt
Words_3L.txt
Words_4L.txt
Words_5L.txt
Words_6L.txt
Words_7L.txt
Words_8L.txt
Words_9L.txt
```

Also note `srd/wordfiles/IB2599.txt` (stray single file; not part of the 634-file corpus).

---

## 6B. Cookie keys (`js-cookie`, 365-day expiry)

Persisted via `saveCookie` extender when `allowSaveCookies` is true (700 ms lockout during preset load):

| Cookie key | Observable | Source file |
|---|---|---|
| `wpm` | `settings.speed.wpm` | speedSettings.ts |
| `fwpm` | `settings.speed.fwpm` | speedSettings.ts |
| `syncWpm` | `settings.speed.syncWpm` | speedSettings.ts |
| `ditFrequency` | `settings.frequency.ditFrequency` | frequencySettings.ts |
| `dahFrequency` | `settings.frequency.dahFrequency` | frequencySettings.ts |
| `syncFreq` | `settings.frequency.syncFreq` | frequencySettings.ts |
| `hideList` | `hideList` | morseExtenders.ts |
| `preSpace` | `preSpace` | morseExtenders.ts |
| `xtraWordSpaceDits` | `xtraWordSpaceDits` | morseExtenders.ts |
| `volume` | `volume` | morseExtenders.ts |
| `noiseVolume` | `noiseVolume` | morseExtenders.ts |
| `noiseType` | `noiseType` | morseExtenders.ts |
| `showExpertSettings` | `showExpertSettings` | morseExtenders.ts |
| `cardFontPx` | `cardFontPx` | morseExtenders.ts |
| `darkMode` | `darkMode` | morseExtenders.ts (+ inline `<head>` flash prevention) |
| `autoCloseLessonAccordian` | `lessons.autoCloseLessonAccordion` | morseLessonPlugin.ts |
| `voiceVoiceName` | `morseVoice.voiceVoiceName` | MorseVoice.ts |
| `rssFeedUrl` | `rss.rssFeedUrl` | morseRssPlugin.ts |
| `proxydUrl` | `rss.proxydUrl` | morseRssPlugin.ts |
| `rssPlayMins` | `rss.rssPlayMins` | morseRssPlugin.ts |
| `rssPollMins` | `rss.rssPollMins` | morseRssPlugin.ts |

Defaults loaded from **`src/configs/licwdefaults.json`** when no cookie exists: `showingText`, `wpm`, `fwpm`, `ditFrequency`, `dahFrequency`, `preSpace`, `xtraWordSpaceDits`, `volume`, `stickySets`, `ifStickySets`, `syncWpm`, `syncFreq`, `hideList`, `showRaw`, `darkMode`, `autoCloseLessonAccordian`, `cardFontPx`, `speakFirst`, `speakFirstRepeats`, `speakFirstAdditionalWordspaces`.

Settings JSON export/import: `MorseSettingsHandler.saveSettings` / `settingsFileChange` (not cookies).

---

## 6C. Event handlers (`click` / `event` / `onclick` in templates + view model)

| KO handler | Trigger | Location | React equivalent |
|---|---|---|---|
| `logoClick` | Logo image click | template:51 | `onClick` on logo (easter egg: 4 clicks → query-string settings) |
| `darkMode(!darkMode())` | Theme toggle | template:59 | `onClick` toggle dark mode |
| `settings.speed.syncWpm(!…)` | FWPM lock span | template:86 | `onClick` toggle sync |
| `lessons.changeUserTarget($data)` | TYPE dropdown item | template:151 | `onClick` |
| `lessons.changeSelectedClass($data,'click')` | CLASS dropdown | template:167 | `onClick` |
| `lessons.setLetterGroup($data,'click')` | CONTENT dropdown | template:183 | `onClick` |
| `lessons.setDisplaySelected($data,false,'click')` | LESSON dropdown | template:199 | `onClick` |
| `lessons.setPresetSelected($data,false,'click')` | PRESET dropdown | template:215 | `onClick` |
| `saveSettings()` | Save preset button | template:221 | `onClick` |
| `settingsFileChange($element)` | Load preset file | template:230 | `onChange` file input |
| `lessons.syncSize(!…)` | Override max lock | template:305 | `onClick` |
| `doApply(true)` | Apply button | template:315 | `onClick` |
| `morseVoice.initEasySpeech` | Voice accordion open | template:513 | `onClick` accordion header |
| `settings.frequency.syncFreq(!…)` | DIT/DAH lock | template:795 | `onClick` |
| `testTone()` | Zero Beat button | template:806 | `onClick` |
| `doClear` | Clear text | template:842 | `onClick` |
| `inputFileChange($element)` | Insert file | template:856 | `onChange` |
| `doDownload` | Audio File download | template:934 | `onClick` |
| `doPlay(false,true)` | Play | template:993 | `onClick` |
| `isPaused()? doPlay(true,false) : doPause(false,true)` | Pause | template:1016 | `onClick` |
| `doPause(true,false,true)` | Stop | template:1023 | `onClick` |
| `shuffleWords(false)` | Shuffle | template:1039 | `onClick` |
| `toggleLoop()` | Loop | template:1044 | `onClick` |
| `speakVoiceBuffer()` | Voice Recap | template:1050 | `onClick` |
| `flaggedWords.addFlaggedWord($data)` | Card single-click | template:1067 | `onClick` |
| `setWordIndex($index())` | Card double-click | template:1067 | `onDoubleClick` |
| `setFlagged` / `clearFlagged` | Flagged words accordion | flaggedWordsAccordion.html | `onClick` |
| `rss.doRSS` / `doRssPlay` / `doRSSReset` | RSS buttons | rssAccordion.html | `onClick` |
| `getElementById('settingsfiletoread').click()` | Load settings (native) | template:225 | programmatic file picker |
| `getElementById('txtfiletoread').click()` | Insert file (native) | template:850 | programmatic file picker |

View-model methods (no direct `data-bind`, invoked from above or shortcuts): `togglePlayback`, `incrementIndex`, `decrementIndex`, `fullRewind`, `changeFarnsworth`, `doPause`, `playEnded`, `changeSoundMaker`, `lessons.doCustomGroup`, `lessons.toggleQueryStringSettingsOn`, RSS plugin timers.

---

## 7. Keyboard shortcuts (registered in `shortcutKeys/morseShortcutKeys.ts`)
Active only when focus is **not** in INPUT/TEXTAREA. Rendered into the help table via `allShortcutKeys`.

| Key | Action | Handler |
|---|---|---|
| `p` | Play / Toggle pause | `togglePlayback()` |
| `s` | Stop & rewind | `doPause(true,false,true)` |
| `,` | Back 1 | `decrementIndex()` |
| `<` | Full rewind | `fullRewind()` |
| `.` | Forward 1 | `incrementIndex()` |
| `f` | Flag current card | `flaggedWords.addFlaggedWord(...)` + announce |
| `c` | Toggle card visibility | `hideList(!hideList())` + announce |
| `/` | Toggle shuffle | `shuffleWords(false)` + announce |
| `l` | Toggle looping | `loop(!loop())` + announce |
| `z` | Reduce Farnsworth WPM | `changeFarnsworth(-1)` |
| `x` | Increase Farnsworth WPM | `changeFarnsworth(1)` |

---

## 8. Key behavioral contracts the React port must preserve
1. **WPM/FWPM coupling** (`SpeedSettings.wpm/fwpm` pureComputeds) and **dit/dah freq coupling** (`FrequencySettings`) — lock icons reflect `syncWpm`/`syncFreq`.
2. **Lesson picker cascade** — changing TYPE→CLASS→CONTENT resets downstream selections (`setupLessonPickerCascade` subscriptions); `displays`/`classes`/`letterGroups` are computed off `wordLists`.
3. **Fresh Play collapses all settings accordions** (`collapseSettingsAccordions`, morse.ts 462) — DOM-class manipulation; replicate in React state.
4. **Cookie persistence** via `saveCookie` extender gated by `allowSaveCookies` — many settings persist; `darkMode` persisted + applied pre-render by inline `<head>` script (template lines 29–36) and `theme.ts`.
5. **Card reveal logic** — `hideList`, `trailReveal`, `maxRevealedTrail`; obscured cards render `'X'.repeat(len)`.
6. **Voice buffer / speakFirst / Recap** flow in `playEnded`/`addToVoiceBuffer`/`speakVoiceBuffer` — intricate; EasySpeech-backed.
7. **Logo easter egg** — 4 clicks toggle `lessons.queryStringSettingsOn` (`logoClick`).
8. **Tom-style deep links** — `?selectedClass=&selectedGroup=&selectedLesson=&selectedPreset=` plus `?rssEnabled`, `?noiseEnabled`, `?morseDisabled`, `?voiceEnabled`, `?voiceBufferMax` (parsed in ctor via `GeneralUtils.getParameterByName`).
9. **`isDev()`** — BETA banner when URL path contains `/dev/` (template line 1117).

---

*End of COMPONENT_MAP.md — KO audit complete. See [Migration Status](#migration-status-updated-2026-06-06) for React port progress.*
