# CLAUDE.md — morsebrowser React Migration
Owner: Roger Reed (rdreed21) | KQ4NKF

## Hard Requirements
| # | Requirement | Solution |
|---|---|---|
| 1 | iOS audio through screen lock | react-native-audio-api + UIBackgroundModes:audio + configureAudioSession() |
| 2 | Accurate Morse timing | Pre-schedule on AudioContext clock — zero setTimeout |
| 3 | Match fork look/feel | rdreed21/morsebrowser_dev develop, Bootstrap 5, no redesign |

## Migration Status (2026-06-14)

| Package | Progress | Tests |
|---|---|---|
| `packages/core` | **Complete** — morse map, timing, scheduler, lessons, presets, cookie settings | 71 passing |
| `apps/web` | **~95% UI** — all accordions, playback, presets, voice, deep links | 108 passing |
| `apps/mobile` | **Day-to-day practice ready** — iOS; background audio needs real-device verification; no automated tests yet | — |

Repo tour: `docs/REPO_MAP.md`. Why it's built this way: `architecture.md`. Decision log:
`decisions.md`. Active backlog: `tasks.md`. Content authoring (lessons/presets/word files):
`docs/ADDING_LESSONS_PRESETS_WORDFILES.md`. iOS status: `apps/mobile/MOBILE_STATUS.md`.
The original KO→React migration bible and agent setup are archived under `docs/archived/`.

## Agents
| Agent | Directory | Job |
|---|---|---|
| 1 Audit | KO repo root | Produce COMPONENT_MAP.md (others wait on this) |
| 2 Core  | packages/core/ | Verify timing, port lessons, check cookie keys |
| 3 Web   | apps/web/ | React + Bootstrap, run visual-diff.mjs per component |
| 4 Mobile| apps/mobile/ | Expo + background audio, test on real iPhone |

## KO → React Quick Reference
| KO | React |
|---|---|
| ko.observable(x) | useState(x) |
| ko.computed(()=>x+y) | useMemo(()=>x+y,[x,y]) |
| data-bind="text:x" | {x} |
| data-bind="visible:x" | {x && <div>} |
| data-bind="foreach:arr" | {arr.map(i=>...)} |
| data-bind="click:fn" | onClick={fn} |
| data-bind="value:x" | value={x} onChange={...} |
| data-bind="css:{a:x}" | className={x?'a':''} |

## Commands
npm install          — first time only
turbo dev --filter=web   — web dev server
turbo test           — all tests
node tools/visual-diff.mjs  — screenshot diff

## Audio Rules
- Never setTimeout for Morse timing
- Always scheduleText from @morsebrowser/core
- Mobile: call configureAudioSession() before any AudioContext
- Background audio: test on real iPhone not Simulator

## AI-Native SDLC workflow

New work on this repo follows Anthropic's AI-Native SDLC Playbook: Plan → Design → Build →
Test → Deploy → Maintain, with a committed artifact at each of the first three stages
(`intent.md` → `spec.md` → `plan.md`). Full guide, templates, and the per-change intent log:
`docs/ai-native-sdlc/README.md`. This CLAUDE.md stays the durable repo-wide context; those
per-change docs reference it rather than duplicate it. The other repo-wide-and-persistent
(not per-change) files: `architecture.md` (the "why"), `decisions.md` (the ADR log),
`tasks.md` (the active backlog) — update these in place rather than creating new ones.

## Documentation Maintenance Policy

- **10-day audit cadence:** at least every 10 days, before/alongside the next batch of work,
  validate `CLAUDE.md` and every doc it links to against the actual code — not just spelling,
  but claims that could now be false (status/progress, "not started" vs. actually shipped,
  file trees, test/file counts, commands). Fix what's stale as part of that batch of work.
- **Every commit to `master`/main that changes code or function behavior:** offer to update
  the relevant documentation (`CLAUDE.md`, `docs/REPO_MAP.md`, `apps/mobile/MOBILE_STATUS.md`,
  etc.) in the same session — don't wait to be asked. Doc-only or config-only commits don't
  need this.
