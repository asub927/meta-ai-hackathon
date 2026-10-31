# U9 evidence — hint ladder and strategy record

Backfill per docs/evidence-backfill-plan.md EB5. PLAN.md U9 sets the
acceptance. The hint button shows only after 8 s of no input or one reaction.
Rungs appear in order. The worked example uses its own numbers on a separate
mini-stage. The chosen strategy lands in IndexedDB as a LocalEvent with no
free text and no identifiers (PLAN.md:447-453). Verify by `verify:hints` DOM
order and number checks, an IndexedDB dump, and a video (PLAN.md:451).

## Commands, all exit 0, run 2026-10-31 on this machine

- `pnpm exec playwright test e2e/hints.spec.ts` in apps/web. 2 passed
  (chromium, webkit-ipad). One test climbs all three rungs in order, asserts
  the worked example shows 12 balloons and never the problem number 15, and
  asserts the strategy event is recorded.
- `pnpm --filter web test`. 60 passed at this head.

## Numbers

- Rung order. Question, visual, worked, asserted by DOM order in-suite.
- Worked-example separation. Pip holds 12 balloons and excludes 15.
- Strategy event. Recorded as a LocalEvent without free text, asserted
  in-suite. No IndexedDB dump file or video exists because the spec writes
  neither. That media gap is recorded here, not claimed.

## Review gate

The standing Anantha review gate for U9 stays open until Anantha closes it
in chat.

## Plan lines satisfied

EB5 lanes 2 (rung order), 3 (worked numbers), 4 (strategy event). Lane 1
trunk regression is partial, head-side proof only. Lane 10 scope. This unit
adds evidence/U9, evidence/U10, and evidence/U11 reports only.

---

# PR4 web — rung-3 worked example explainer panel (2026-10-31, branch poteto/explainer-web)

Builds the web UI for docs/WORKED-EXAMPLE-EXPLAINER.md rung 3 on the finished
core derivation (branch poteto/explainer, commit 75ba416). Failing checks were
written first (new `ExplainerPanel.test.tsx` against a missing module, a
rewritten rung-3 cue case in `hints.test.ts`): 15 web unit failures recorded
red, then turned green. No normative docs were edited.

## What changed

- `apps/web/src/story/hints.ts`. Rung-3 cue is now `explainer`: the pinned
  question plus the literal derivation steps from `q.hints[2]`. The old
  `worked` cue shape (separate-numbers chips) is gone.
- `apps/web/src/story/ExplainerPanel.tsx` (new). Panel state machine
  (`panelReducer`: one step per Next/Back, clamped) and the panel: question
  pinned at top, one plain-text step, progress line, Back/Next, `Try it` on
  the last step. No mascot content.
- `apps/web/src/main.tsx`. Rung 3 renders the panel (keyed per question);
  `Try it` sends `hint`, and the reducer re-asks the original question, so
  completion returns to the question. The Hint button stays available as the
  leave-anytime path.
- `apps/web/src/index.css`. Light explainer styles, big step text,
  transform/opacity-only transition; reduced-motion block kills explainer
  movement.
- `apps/web/src/author/author.ts` (+ tests). The authoring tool now derives
  rung 3 via `deriveExplainer` per story kind (take-away directly, add and
  two-step retrace the take-away step, compare-bigger uses compare-more) and
  attaches the same derivation to every question. The separate-numbers example
  tables and `pickExample` are removed; their tests became same-question
  derivation assertions.
- `packages/conformance/vectors/*.json` regenerated. The core PR changed the
  `smaller` question shape, so the golden vectors went stale (one e2e failure,
  fixed by regeneration, not by editing expectations by hand).

## Commands and counts

- `pnpm --filter web typecheck`. Clean.
- `pnpm --filter web test`. 9 files, 85 tests, all pass (baseline before this
  unit: 15 failed, 64 passed).
- `pnpm --filter @kids-math/core test`. 83 passed (core untouched).
- `pnpm --filter @kids-math/conformance test`. 5 passed.
- `pnpm --filter web exec playwright test` (full e2e, chromium). 34 passed,
  including the rewritten `hints.spec.ts` (climbs the real ladder to rung 3;
  asserts pinned question, Next advances one step, Back returns, no Pip or
  puffbun in the panel, Try-it returns to the re-asked question with the
  answer input visible, strategy event recorded) and the updated
  `lesson.spec.ts` / `lesson1.spec.ts` hint tests.
- `playwright test e2e/hints.spec.ts e2e/lesson.spec.ts --project=webkit-ipad`.
  7 passed.
- `pnpm --filter web lint:never-wrong`. Clean.
- `node scripts/gap-check.mjs`. 34/35; the single red is the pre-existing
  `u15-reviews-checked: unchecked boxes`, identical before this unit.

## Still manual-only

- A real VoiceOver pass over the panel steps (unit asserts plain-text
  presence, not screen-reader behavior).
- Visual confirmation of the reduced-motion final state on a device with the
  OS setting on (unit asserts the CSS contract only).
- No IndexedDB dump file or video for this unit; same media gap as the EB5
  section above.
- The standing Anantha review gate for U9 stays open until Anantha closes it
  in chat.
