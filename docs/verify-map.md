# Verify map

Every `verify:*` script in both `package.json` files, the file that implements
it, and the PLAN.md gate it enforces. A name missing here is a gap.

## Root `package.json`

| Script | Runs | Gates |
|---|---|---|
| `verify:doctor` | `.claude/skills/verify-kids-math-web/scripts/doctor.mjs` | Environment readiness: repo root, `apps/web/package.json`, Node/pnpm, Playwright browsers. Read-only. |

## `apps/web/package.json`

| Script | Runs | Gates |
|---|---|---|
| `verify:doctor` | same `doctor.mjs` as root | Same readiness check from the app directory. |
| `verify:beats` | `e2e/lesson.spec.ts -g beats` | PLAN.md:388 beat parity vs baseline: DOM totals `[24,15,20]`, 58 cues, clean console. |
| `verify:lesson` | `e2e/lesson.spec.ts -g lesson` | PLAN.md:469 offline reload/resume with first-party-only requests; PLAN.md:495 the 3 U12 child paths with zero console errors. |
| `verify:react` | `e2e/lesson.spec.ts -g reaction` | PLAN.md:442 reaction play-out: child number staged, conservation readout, never marked wrong. |
| `verify:hints` | `e2e/lesson.spec.ts -g hints` | PLAN.md:451 hint ladder order, worked example with its own numbers. |
| `verify:speech` | `e2e/lesson.spec.ts -g speech` | PLAN.md:484 read-aloud through on-device (`localService`) voices only. |
| `verify:log` | `e2e/lesson.spec.ts -g log` | PLAN.md:478 answers recorded on-device and exportable. |
| `verify:fps` | `scripts/verify-fps.mjs` | PLAN.md:388 59 fps or better at 4x throttle, 6 or fewer frames over 20 ms. Prints one `metric value rule verdict` line per metric on stdout. |
| `verify:seek` | `e2e/seek.spec.ts` | PLAN.md:424 `__render.seek(t)` determinism: 3 timestamps hashed twice each. |
| `verify:interact` | `e2e/interact.spec.ts` | PLAN.md:433 touch answers via real pointer events, 64 px targets, no overlap in either orientation. |
| `verify:audio` | `e2e/audio.spec.ts` | PLAN.md:460 `audioState()` running after the Start tap, cues fire, resume across visibility change. |

## Notes

- `verify:*` entries pin `--project=chromium` where the gate is about the harness
  passing in this runner. WebKit iPad projects remain the device gate per the
  U12 acceptance (PLAN.md:486) and are not replaced by these entries.
- `e2e/lesson1.spec.ts` covers the full 5-story NC.2.OA.1 lesson on all 3 child
  paths with a console-error listener per test; it is driven directly by
  `playwright test e2e/lesson1.spec.ts` until a `verify:lesson1` entry is cut.
