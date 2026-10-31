# U14 evidence — generator with the LLM boundary

Spec: `gen/examples/stickers-31-12.spec.json` (Momo, 31 − 12).
Command: `GEN_CACHE=replay pnpm gen gen/examples/stickers-31-12.spec.json`.
Exit 0. Output: `gen/out/gen-stickers-31-12.draft.json` (gitignored).
Sample: `evidence/U14/sample-draft.json` (the validated story).

## Result

- `{"status": "validated", "slots": 0, "issues": []}`.
- Solved by code: totals `[31, 19]`, answer `19`.
- The project lever agrees: `validate /tmp/draft-story.json` prints ok.

## Determinism

- `GEN_CACHE=replay` replays `gen/cache/gen-stickers-31-12.attempt1.json`
  and never touches the network. The suite asserts replay mode fails closed
  on a missing key (`missing-cache`).
- The recorded file is a hand-authored fixture in recorded shape until a
  live gateway run replaces it. See `gen/cache/README.md`.

## Red-team rejection log

- Fake model returns `Momo has 15 left!` and `try again` in every line.
- Both attempts rejected. Status `needs-human`, story null.
- Codes: `digit-in-template`, `never-wrong`. Slots: 28.
- Numeric fields the model returns (`answer`, `totals`) are never read.
  The suite asserts the validated story keeps the solver answer.

## Unit checks

- `node --test gen/`: 20 passed across 6 suites (spec, good replay, numbers ignored,
  red-team, retry with issues fed back, word-problem parse, replay closed,
  shape checks, plus eval-harness cases added since).
- `pnpm --filter @kids-math/core test`: 71 passed (unchanged).
- Retry confirmed: bad draft, then fixed draft, second prompt carries
  the `digit-in-template` issue text.

## Operator notes

- Live runs need `GEN_GATEWAY_URL` and `GEN_GATEWAY_KEY`. The model id
  lives in `gen/config.mjs`, overridable with `GEN_MODEL`.
- No provider SDK anywhere. The only network call is one `fetch` POST.
