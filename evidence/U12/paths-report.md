# U12 evidence — lesson 1 runnable acceptance, three paths

Backfill per docs/evidence-backfill-plan.md EB6. PLAN.md U12 sets the
acceptance. A scripted WebKit iPad run for each of 3 child paths completes
all 5 stories with zero console errors. Paths are all right, one
misconception per question, and all hints. Validate is clean. Full run holds
58 fps or better at 4x throttle. Read-aloud covers every line. Anantha plays
it on a real iPad and approves (PLAN.md:486-498). Verify by
`verify:lesson --paths all`, the fps table, and 3 videos (PLAN.md:495).

## Commands, run 2026-10-31 on this machine

- `pnpm exec playwright test e2e/lesson1.spec.ts` in apps/web. 6 passed,
  3 paths on 2 projects (chromium, webkit-ipad).
- Per-story `validate` through the core CLI. 5 of 5 print `ok`
  (stories extracted to scratch files, see note below).
- `pnpm -r test` and `pnpm -r typecheck`. Fully green (core 71, web 60,
  conformance 5, gen 20; typecheck clean in all three packages).

## Per-path results, zero console errors asserted in-suite on both projects

- All-right. All 5 stories complete to the `lesson1-done` marker. Stories
  run S1 take-from start-unknown (fewer, 24), S2 add-to start-unknown
  (more, 25), S3 compare bigger (25), S4 compare smaller (24), S5 two-step
  (more, fewer, 8).
- One-misconception. Story 1 answered 33, reaction plays with no wrong
  language, Keep going, answer 24, remaining stories complete to done.
- All-hints. Story 1 answered 33, Keep going, three Hint rungs, worked
  example shows Ended with 10 and excludes 24, answer 24, remaining stories
  complete to done.

## Validation note

`validate` accepts one story per file (solved, questions, reactions at top
level, as in `packages/core/fixtures/good/`). The lesson file is a 5-story
wrapper (id, standard, stories). Running the CLI over the wrapper reports
`invalid-shape` for the wrapper keys. Each of the 5 stories validates `ok`
on its own. The wrapper shape gap is recorded here, not hidden. Lesson
content is unchanged by this unit.

Addendum 2026-10-31: the CLI now validates lesson wrappers story by story
(packages/core/src/cli.ts), so the wrapper validates clean directly: 5 of 5
`ok` for lessons/nc-2-oa-1-lesson-1.json and `ok` for the U15a authored file.

## Not run, operator-open

- No video. The specs record no video and no new harness was built for a
  backfill, per the plan. No videos sit beside this report.
- No fps table. The 58 fps bar at 4x throttle and the real-iPad approval
  stay with Anantha per Appendix C. Both are operator-open.
- Read-aloud per line on device is covered only by the stubbed speech suite
  and the on-device-only voice assertion, both green. The real-iPad
  read-aloud check stays open.

## Plan lines satisfied

EB6 lanes 2, 3, 4 (three paths complete), 5 (zero console errors asserted),
6 (written equation per story end, asserted in the lesson1-done flow),
8 (per-story validate clean). Lane 7 speech stub and lane 9 log round-trip
are covered by their own suites, green at this head. Lane 1 trunk regression
is partial, head-side proof only. Lane 10 scope. This unit adds this report
only.

## Review gate

The U12 Anantha gate stays open. Anantha plays all 3 paths on a real iPad
and approves in chat.
