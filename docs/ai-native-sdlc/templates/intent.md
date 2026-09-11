<!--
INTENT — Plan stage.
One file per feature/fix. Copy this into docs/ai-native-sdlc/intent/YYYY-MM-DD-short-slug.md,
fill it in, and commit it before starting design/build. Keep it short — this is a brainstorm
captured on paper, not a spec.
-->

# Intent: <short title>

**Date:** YYYY-MM-DD
**Author:** Roger Reed (KQ4NKF)
**Status:** draft | approved | superseded

## Why
What problem does this solve, or what's the opportunity? Who hits this (LICW members
practicing Morse, you as maintainer, etc.)?

## What's wanted
Plain-language description of the desired outcome. Not implementation detail — that's the
spec's job.

## Constraints
- Must respect the Hard Requirements in root `CLAUDE.md` (iOS lock-screen audio, no
  `setTimeout` for timing, match `morsebrowser_dev` look/feel) — call out any that apply.
- Any package boundaries this should stay within (`packages/core`, `apps/web`,
  `apps/mobile`)?
- Any deadline (e.g. before a specific LICW class/session)?

## Out of scope
What this explicitly does *not* cover, to stop scope creep later.

## Success criteria
How you'll know it's done — testable/observable, not vibes.

## Related
- Links to relevant docs (`docs/REPO_MAP.md`, `apps/mobile/MOBILE_STATUS.md`, etc.)
- Related issues/PRs
