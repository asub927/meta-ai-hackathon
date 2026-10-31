# U10 evidence — iPad audio and lifecycle

Backfill per docs/evidence-backfill-plan.md EB5. PLAN.md U10 sets the
acceptance. In WebKit `audioState()` reads running after the Start tap. After
background and foreground, audio resumes. All cues still fire within 17 ms of
their timeline position (PLAN.md:456-462). Verify by `verify:audio` in WebKit
and the cue log diff, plus a real-iPad check by Anantha as gate (PLAN.md:460).

## Commands, all exit 0, run 2026-10-31 on this machine

- `pnpm run verify:audio` in apps/web. 4 passed on chromium.
- `pnpm exec playwright test e2e/audio.spec.ts --project=webkit-ipad`
  in apps/web. 4 passed on the iPad Pro 11 profile, covering the
  PLAN.md:460 WebKit ask beyond the chromium-pinned alias.
- Suite titles, each green on both projects. Start unlocks audioState to
  running and it survives a visibility toggle. Playing a beat records a
  nonempty cue log. Read-aloud toggle hides with no local voice. Read-aloud
  speaks Pip lines through the on-device voice only.

## Cue log measurement

A scratch probe played the full sticker right path on chromium on 2026-10-31
and read `__cueLog()`. Result. 3 cues, all named `say`. No `sfx.json`
baseline exists in the repo, so the 58-cue U3 baseline name-and-count diff
(EB5 lane 7 as written) is not runnable. The nonempty cue assertion above is
the runnable evidence. The full diff stays open.

## Review gate

The real-iPad audio check belongs to Anantha and stays open. Emulation
cannot prove the silent-switch behavior.

## Plan lines satisfied

EB5 lanes 5 (unlock running) and 6 (resume running), each on both projects.
Lane 7 is recorded open per the baseline note. Lane 10 scope as in the U9
report.
