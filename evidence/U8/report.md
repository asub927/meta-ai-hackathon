# U8 evidence — reactions that play out

Backfill per docs/evidence-backfill-plan.md EB4. PLAN.md U8 sets the
acceptance. For 33, 9, 25, and 14 on the sticker problem the on-screen book
count equals the child's number during play-out and the conservation readout
shows the real start. The never-wrong lint finds no wrong, incorrect, red X,
or error-red token in a reaction path. Reduced motion keeps state and drops
movement (PLAN.md:438-445). Verify by `verify:react` DOM reads mid-reaction
with screenshots and video, plus `lint:never-wrong` (PLAN.md:442).

## Commands, all exit 0, run 2026-10-31 on this machine

- `pnpm exec playwright test e2e/react.spec.ts` in apps/web. 14 passed,
  7 tests on 2 projects (chromium, webkit-ipad).
- `node scripts/lint-never-wrong.mjs` in apps/web. Exit 0, prints
  `never-wrong: clean`.

## Per-reaction staged numbers, asserted mid-reaction in the DOM

- 33. book-count 33, start-count 24, staging marker visible, puzzled
  expression visible, no wrong language on the page.
- 9. book-count 9, start-count 24, same markers.
- 25. book-count 25, start-count 24, same markers.
- 14. book-count 14, start-count 24, same markers.
- 42 on final. count-together staging, book-count 42, start-count 24.
- Smaller question. After Keep going the pip reads Count what Momo has now,
  distinct from the pre-reaction line, and answering 15 reaches How did you
  know.
- Reduced motion. State identical at 33 with movement dropped.

## Screenshots and review gate

The react spec asserts through DOM reads and saves no PNGs and no video, so
no new media sits beside this report. The standing Anantha review gate for
U8 stays open until Anantha closes it in chat.

## Plan lines satisfied

EB4 lanes 7 (reaction 33 staging), 8 (reactions 9, 25, 14), 9 (lint exit
0). Lane 10 scope as in the U7 report.
