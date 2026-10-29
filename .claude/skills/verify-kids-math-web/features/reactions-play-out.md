# Wrong answers play out

A wrong answer is staged as if true (the book fills to the child's number, the tray still holds what flew away), the conservation mismatch shows, Pip asks a smaller question. Never a red X, never "wrong"/"try again". Planned acceptance: PLAN.md U8.

## Sub-features

- `react-wrong-operation` — answer 33 on the sticker problem (24 − 9): book shows 33, tray 9, start readout 24.
- `react-echoed-given` — answer 9: Pip asks how many stayed.
- `react-unknown-fallback` — an unrecognized wrong answer falls back to count-together.
- `never-wrong-lint` — built bundle contains no "wrong"/"incorrect"/"try again", no red-X glyph or error-red token in reaction paths.

## How to get to it (user POV)

- In a story's count question, enter a wrong number on the number pad and confirm.

## Driving it with Playwright

Preconditions:

- Baseline. Command: `npm run verify:react`.

- **Play out 33.** Enter 33. Mid-reaction, DOM book count = 33, tray = 9, start counter = 24 (read DOM numbers, not pixels). Pip's line asks where the extra came from; phase returns to a smaller asking question.
- **Echo 9.** Enter 9. Book stays at start pile, Pip line identifies 9 as what flew to the friend.
- **Fallback.** Enter a wrong number matching no registry detector. Reaction is count-together (slow count with highlights).
- **Lint.** Run `npm run lint:never-wrong` over the built bundle — exit 0.
- **Proof.** Screenshots mid-reaction per case + 4-reaction video in `evidence/U8/`; reduced-motion run keeps the same end state with movement dropped.

## Gotchas

- Assert mid-reaction, not after: the staged wrong number is transient by design.
- Mascot expression during reaction must be `puzzled`, never sad/cross — check the rig state attribute, not the screenshot vibe.
- A reaction that returns to the *same* question instead of the smaller follow-up is a failure (PLAN.md U5).
