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
