# Hint ladder and explain

Hints climb exactly question → visual cue → worked example (different story, different numbers — sharing any number with the problem fails validation), then the original question is asked again. The tutor still never states the answer. After a correct answer, "How did you know?" records a strategy. Planned acceptance: PLAN.md U5, U9.

## Sub-features

- `hint-gating` — hint button appears only after 8 s idle or one reaction.
- `hint-order` — rungs appear in order; rung 3 is the worked example on a separate mini-stage with its own numbers.
- `hint-reask` — after the worked example, the original question is asked again (rung resets).
- `explain-record` — chosen strategy is appended to the `LocalEvent` log; no free text, no identifiers.

## How to get to it (user POV)

- In a question, wait (or answer wrong once), tap the hint button repeatedly; answer correctly to reach "How did you know?".

## Driving it with Playwright

Preconditions:

- Baseline. Command: `npm run verify:hints`.

- **Gating.** On a fresh question the hint button is absent/disabled; after advancing the clock 8 s (or one reaction) it appears.
- **Order.** Tap hint 3 times: DOM order is question rung, visual cue (highlight/count-along/ten-frame), worked mini-stage. Assert worked-example numbers ∩ problem numbers = ∅.
- **Re-ask.** After rung 3, the bubble text equals the original question; no `say` line before the correct answer contains the answer value.
- **Explain.** Answer correctly, choose "I counted back". IndexedDB dump in `evidence/U9/` shows one strategy `LocalEvent` (`counted-back`), no free-text fields.
- **Proof.** Video + IndexedDB dump; property replay (1,000 random answer sequences reaching `done`) is the formal skill's job, not this recipe's.

## Gotchas

- Advancing a fake clock can also fire the 8 s "patient" expression beat — distinguish hint-gating from the nod toward the hint button.
- The worked example *says its own* answer (`{wAfter}`) — that is legal; the original problem's answer must still never be said.
- If seed fixtures lack a 3-rung ladder, report the precondition failure in this file; never weaken the recipe to 2 rungs.
