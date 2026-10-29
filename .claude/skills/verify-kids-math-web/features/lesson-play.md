# Play a Socratic lesson

A child picks lesson 1, works 5 NC.2.OA.1 stories with Pip asking (never telling), and finishes with a mascot celebration under 2 s. Planned acceptance: PLAN.md U12.

## Sub-features

- `lesson-pick` — picker lists approved lessons only, progress dots visible.
- `lesson-right-path` — correct answers flow asking → explaining → next story → done.
- `lesson-finish` — all 5 stories complete, celebration plays, lesson marked complete.

## How to get to it (user POV)

- Open the app → tap the lesson card in the picker (route: lessons → play).

## Driving it with Playwright

Preconditions:

- Baseline (see README). Command: `npm run verify:lesson -- --paths all` (WebKit, iPad Pro 11 landscape; repeat iPad Mini portrait).

- **Pick.** Click the lesson 1 button by role/name. Play route loads, stage is 1280×720 letterboxed, Pip's first bubble appears in the `aria-live="polite"` region.
- **Right path.** Answer each question correctly via the real widget (number pad / tap-items / drag / equation choice). Each correct answer reaches the "How did you know?" explain step, then the next story.
- **Finish.** After story 5, celebration (< 2 s) plays and the picker shows lesson 1 complete; zero console errors for the whole run; ≥ 58 fps at 4× CPU throttle.
- **Proof.** Video of the full run + `evidence/U12/` screenshots per story; console log attached.

## Gotchas

- Audio only unlocks on the title **Start** tap — skipping it makes later cue assertions flaky.
- If no approved lesson is bundled, the picker is legitimately empty: report as unmet precondition, do not seed a draft lesson silently.
- Emulation does not model the iPad silent switch or real voices — real-iPad approval is a separate human gate (U12).
