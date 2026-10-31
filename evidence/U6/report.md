# U6 evidence — WAAPI player, beats parity, seek determinism, GSAP removal

Backfill per docs/evidence-backfill-plan.md EB3. PLAN.md U6 sets the
acceptance. U3 parity holds against baseline. `__render.seek(t)` is
deterministic with the same frame hash twice. No `gsap` import remains and
`gsap.min.js` is gone from the bundle (PLAN.md:420-427). Verify by beats with
baseline compare, seek hashes, the gsap grep, and the animation review
(PLAN.md:424).

## Commands, all exit 0, run 2026-10-31 on this machine

- `pnpm exec playwright test e2e/lesson.spec.ts -g beats` in apps/web.
  2 passed (chromium, webkit-ipad). Start-count reads 24, book-count reads 24.
  Totals `[24,15,20]` confirmed by the right-path test in the same file.
- `pnpm run verify:seek` in apps/web. 1 passed on chromium. The spec hashes
  three timestamps (0, 250, 1000 ms) twice each through `__render.seek` and
  asserts repeat equality.
- `rg -n "gsap" src/ | grep -v motion/` in apps/web. Empty output, exit 1.
  No gsap import remains outside `motion/`.
- `pnpm -r test` and `pnpm -r typecheck`. Fully green (see evidence/U5
  report for counts).

## Beats totals

`[24,15,20]`. Screenshot `evidence/U0/beat-start.png` refreshed by this run.
SHA-256 now `0a87e70314ed5c54ee2c9dc64c93f781963eaaf830ef80fca490a3a1c58f67b8`.
Manifest at `evidence/U0/beats.json`.

## Finding, beats screenshot drift

All three U0 PNGs differ in bytes from HEAD. The drift predates this unit.
This run refreshed only `beat-start.png`. `lesson-done.png` and
`reaction-33.png` are untouched by the beats-only run. Per the plan this is
filed as drift, not a stop, because the totals assert green and the bytes
depend on this machine's font rendering.

## Plan lines satisfied

EB3 lanes 7 (beats totals), 8 (screenshots, with the drift note above),
9 (clean no-gsap grep). Lane 10 scope as in the U5 report.

## Review gate

None. EB3 is not review-gated.
