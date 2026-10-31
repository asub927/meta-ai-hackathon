# U4 evidence — schema, solver, validator (PLAN.md §4 U4)

## Scope landed

- `solve()` extended (`packages/core/src/core.ts`): result-unknown (existing),
  start-unknown and change-unknown derived from the known `result`, compare
  (`bigger` / `smaller` / `difference`). Impossible problems throw coded errors
  (`negative-count`, `count-above-capacity`, `missing-result`, `missing-hero-count`)
  instead of deriving a bad count. `answer` is always the value the child must find.
- `parseStoryData(json)` (`packages/core/src/schema.ts`): Zod 4 strict-object
  boundary parse; hint-ladder and misconception failures map to specific codes.
- `validateStory(story)` (`packages/core/src/validate.ts`): recomputes every
  derived number and enforces the tutor-rule contract. Callers branch on
  `Issue.code`, never on message text.
- `npm run validate <file…>` CLI (`packages/core/src/cli.ts`).

## Fixture matrix (expected code per bad fixture)

| file | expected code |
|---|---|
| bad/totals-edited.json | totals-mismatch |
| bad/digit-in-template.json | digit-in-template |
| bad/above-capacity.json | count-above-capacity |
| bad/negative.json | negative-count |
| bad/hint-order.json | invalid-hint-ladder |
| bad/worked-shares.json | worked-example-shares-number |
| bad/try-again.json | never-wrong |
| bad/bubble-too-long.json | bubble-too-long |
| bad/gendered.json | gendered-word |
| bad/unknown-misconception.json | unknown-misconception |
| bad/nc-source.json | forbidden-source-licence |
| bad/no-standard.json | missing-standard |
| bad/pasted-standard-text.json | invalid-shape |

Good fixtures (parse + validate clean): stickers, balloons, start-unknown,
compare-bigger, two-step — covering result/start/change-unknown, compare and
two-step NC.2.OA.1 shapes.

## Solver oracle

10,000 seeded random problems across all five shapes, checked against
independent arithmetic in `core.test.ts` (in addition to the existing
500-case oracle).

## Verification (2026-10-29, all green)

- **Unit tests:** `pnpm --filter @kids-math/core test` — 71 passed
  (evaluate 11, validate 11, lesson 4, fixtures 18, core 16, u5 11;
  includes the 10,000-case oracle). Re-measured 2026-10-31; the old
  all-green figure from 2026-10-29 predates the evaluate/lesson/u5 suites.
- **Typecheck:** `pnpm -r typecheck` — clean for `packages/core` and `apps/web`.
- **CLI:** `pnpm run validate fixtures/good/*.json` — 5/5 `ok`, exit 0.
  `pnpm run validate fixtures/bad/*.json` — 13/13 failed with the expected
  code from the matrix above, exit 1. (CLI compiles via `tsconfig.cli.json`
  to `.validate-dist/`; Node type-stripping cannot resolve the internal
  `.js` → `.ts` imports, so it is not used.)
- **Formal verification:** `.claude/skills/formal-verify-socratic-core/scripts/check_model.py` — PASS on P1–P5 (tutor never tells,
  every path reaches done, hint-ladder shape, double-tap safety, mastery
  monotonicity); all three mutants (tell-answer, stuck-reaction,
  mastery-drops) caught. Reducer semantics unchanged by U4, so the model
  needed no update.
- **Web (M0 regression):** doctor PASS on all checks; Playwright 12/12
  (6 tests × WebKit iPad Pro 11 + Chromium), including the hints test against
  the corrected worked example.
