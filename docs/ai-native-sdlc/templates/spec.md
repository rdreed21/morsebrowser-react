<!--
SPEC — Design stage.
Claude drafts this from the intent.md; you review and resolve flags before build starts.
Save alongside the intent it came from: docs/ai-native-sdlc/intent/YYYY-MM-DD-short-slug.spec.md
-->

# Spec: <short title>

**From intent:** `docs/ai-native-sdlc/intent/YYYY-MM-DD-short-slug.md`
**Date:** YYYY-MM-DD
**Status:** draft | approved

## Requirements

### Functional
What the feature/fix must do, as concrete behaviors.

### Non-functional
Performance, timing accuracy, accessibility, offline behavior, etc. — whatever applies.

## Affected packages
- [ ] `packages/core`
- [ ] `apps/web`
- [ ] `apps/mobile`
- [ ] `workers`
- [ ] docs only

## Hard Requirements check
Go through the root `CLAUDE.md` table explicitly:

| Requirement | Applies? | Notes |
|---|---|---|
| iOS audio through screen lock | | |
| Accurate Morse timing (no setTimeout) | | |
| Match fork look/feel (Bootstrap 5, no redesign) | | |

## Design decisions
Key choices and why (data shape, component boundaries, new dependencies — new deps are a
flag, not a default).

## Open questions / flags
Anything ambiguous, risky, or that conflicts with a hard requirement — resolve these before
moving to Build.

## Approval
- [ ] Reviewed by Roger — ready for plan mode
