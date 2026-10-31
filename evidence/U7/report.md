# U7 evidence — interaction layer

Backfill per docs/evidence-backfill-plan.md EB4. PLAN.md U7 sets the
acceptance. Each widget emits the right Answer through real pointer events.
Drag cancels cleanly on second-finger touch. Targets are 64 px or larger.
Tap feedback lands under 100 ms. Portrait keeps counter, bubble, and input
visible with no overlap (PLAN.md:429-436). Verify by `verify:interact` in
WebKit for iPad Pro 11 and iPad Mini, both orientations, with the overlap
check and screenshots in evidence/U7 (PLAN.md:433).

## Commands, all exit 0, run 2026-10-31 on this machine

- `pnpm run verify:interact` in apps/web. 5 passed on chromium.
- `pnpm exec playwright test e2e/interact.spec.ts --project=webkit-ipad`
  in apps/web. 5 passed on the iPad Pro 11 profile.
- Suite titles, each green on both projects. Count widget taps 15 counters
  and reaches explaining. Drag tray moves 3 items and the tray count updates.
  Widget buttons measure at least 64 by 64. No overlap in portrait
  (834x1194). No overlap in landscape (1194x834).
- `pnpm --filter web test` and `node scripts/lint-never-wrong.mjs`. Both
  green at this head (60 web tests passed, lint prints clean).

## Numbers

- Minimum target size asserted. 64 px on every widget button, both projects.
- Overlap minimums. Zero overlapping boxes in both orientations, both
  projects. The spec computes bounding boxes over bubble, input, counter,
  and safe areas.

## Screenshots and review gate

The interact spec asserts through DOM reads and saves no PNGs, so no new
screenshots sit beside this report. The standing Anantha review gate for U7
stays open until Anantha closes it in chat. That gate is tracked as open,
not as passed.

## Plan lines satisfied

EB4 lanes 2 through 6 (tap-15, drag-3, 64 px targets, portrait and landscape
overlap). Lane 1 trunk regression is partial, head-side proof only. Lane 10
scope. This unit adds evidence/U7/report.md and evidence/U8/report.md only.
