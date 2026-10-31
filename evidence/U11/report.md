# U11 evidence — lesson shell and offline, plus event log round-trip

Backfill per docs/evidence-backfill-plan.md EB5. PLAN.md U11 and U11a set the
acceptance. Airplane-mode reload works after the first visit. Killing the tab
mid-story resumes at that question. No request leaves first-party origins.
Export then import on a fresh profile reproduces identical derived progress,
and a tampered import is rejected at the boundary (PLAN.md:465-478). Verify
by the shell spec offline, with request log and reload-resume check, and the
log spec with export, clear, import, and compare (PLAN.md:469,478).

## Commands, all exit 0, run 2026-10-31 on this machine

- `pnpm exec playwright test e2e/shell.spec.ts` in apps/web. 10 passed,
  5 tests on 2 projects (chromium, webkit-ipad).
- Suite titles, each green on both projects. Shell serves offline after the
  first visit. Resume returns to the saved phase. Log export and import
  round-trips events identically. A tampered log import is rejected at the
  boundary. Lesson loads with same-origin requests only.

## Numbers

- Resume phase. Pre-kill and post-reload phases match in-suite.
- Round-trip. Exported events reimported on a cleared profile compare
  identical in-suite. No export file is committed because the spec holds the
  comparison in memory.

## Plan lines satisfied

EB5 lanes 8 (offline reload resume) and 9 (round-trip identical). Lane 10
scope as in the U9 report.

## Review gate

None. EB5 is not review-gated.
