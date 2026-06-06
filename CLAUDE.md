# CLAUDE.md — morsebrowser React Migration
Owner: Roger Reed (rdreed21) | KQ4NKF

## Hard Requirements
| # | Requirement | Solution |
|---|---|---|
| 1 | iOS audio through screen lock | react-native-audio-api + UIBackgroundModes:audio + configureAudioSession() |
| 2 | Accurate Morse timing | Pre-schedule on AudioContext clock — zero setTimeout |
| 3 | Match fork look/feel | rdreed21/morsebrowser_dev develop, Bootstrap 5, no redesign |

## Migration Status (2026-06-06)

| Package | Progress | Tests |
|---|---|---|
| `packages/core` | **Complete** — morse map, timing, scheduler, lessons, cookie settings | 40 passing |
| `apps/web` | **~70% UI** — all main accordions; playback depth remains | 44 passing |
| `apps/mobile` | Not started | — |

Full component-by-component breakdown: `COMPONENT_MAP.md` § Migration Status.

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
