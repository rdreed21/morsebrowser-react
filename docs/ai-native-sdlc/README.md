# AI-Native SDLC — how it works on this repo

This is a working adaptation of Anthropic's [AI-Native SDLC Playbook](https://claude.com/blog/the-ai-native-sdlc-playbook)
for `morsebrowser-react`. It's a solo-maintainer project (Roger Reed / KQ4NKF), so the
"governance" is one person reviewing their own AI-generated artifacts at each gate instead
of a team — but the artifact trail and the discipline of not skipping stages is the point.

The playbook's six stages, and what each one looks like here:

## 1. Plan → `intent.md`
Before any code, capture **what** is wanted, **why**, and under what constraints, as a
short markdown file. This replaces "just start coding" with a deliberate pause.

- Template: [`templates/intent.md`](templates/intent.md)
- Real intents live in [`intent/`](intent/), one file per feature/fix, named
  `YYYY-MM-DD-short-slug.md`
- Write it yourself, or brainstorm it out loud with Claude — either way, it gets committed
  before implementation starts.

## 2. Design → `spec.md`
Claude turns the intent into a spec: functional/non-functional requirements, which package(s)
it touches (`packages/core`, `apps/web`, `apps/mobile`), and how it holds up against this
repo's **Hard Requirements** in the root [`CLAUDE.md`](../../CLAUDE.md) (iOS background audio,
zero-`setTimeout` timing, matching the `morsebrowser_dev` fork's look/feel). Anything that
conflicts with those gets flagged and resolved here, not discovered mid-build.

- Template: [`templates/spec.md`](templates/spec.md)

## 3. Build → `plan.md`
Start Claude Code in **plan mode** (read-only) against the spec. Claude proposes a concrete
implementation plan — files touched, order of operations, test plan. Review and approve the
plan *before* Claude writes a single line of code. Only then does it implement, usually in
one pass.

- Template: [`templates/plan.md`](templates/plan.md)

## 4. Test → continuous verification
Every Claude Code session that implements should close its own loop before handing back:
run `turbo test`, and for `apps/web` UI changes, `node tools/visual-diff.mjs` to catch visual
regressions against the KO fork. Claude fixes failures itself before asking for human review —
don't rubber-stamp red tests.

## 5. Deploy → gated review
Even solo, treat a PR as a gate: look at the diff against the intent/spec, not just "does it
run." CI (`.github/`) enforces the mechanical checks; you review for intent and risk. Nothing
merges to a protected branch without that human look.

## 6. Maintain → close the loop
Bugs, real-device findings (e.g. iOS background-audio issues — see
`apps/mobile/MOBILE_STATUS.md`), or new club requirements become a *new* `intent.md`, not an
ad hoc patch. That's what keeps the audit trail (git history of intent → spec → plan → diff)
meaningful instead of decorative.

## Quick start for a new piece of work

```bash
cp docs/ai-native-sdlc/templates/intent.md docs/ai-native-sdlc/intent/$(date +%F)-my-feature.md
# fill it in, commit it
# then start a Claude Code session: "read docs/ai-native-sdlc/intent/2026-09-11-my-feature.md
# and draft a spec.md for it"
```

Keep `CLAUDE.md` itself as the durable, repo-wide context (conventions, hard requirements,
commands) — `intent.md`/`spec.md`/`plan.md` are per-change artifacts that reference it, not
replace it.
