# U15 evidence — generator eval

Live run Nov 1, 2026, model muse-spark-1.3-contributor via the harness
gateway (GEN_GATEWAY_PROTOCOL=anthropic, GEN_MAX_TOKENS=24000,
GEN_CACHE=auto). Eight specs whose recorded responses used
answer-resolving placeholders were re-rolled live under the tightened
contract; the other twelve replayed clean. Specs: 20.

## Rates

- First-pass validated: 10/20.
- Validated after retry: 20/20.
- Human slots total: 0.
- Issue codes: banned-placeholder x13 across 8 specs plus
  invalid-model-json x2 (both truncated first-pass records, retried by
  design), all on the first pass only; all 20 final drafts carry zero
  issues.

## Table

| spec | standard | first pass | final | slots | codes |
|---|---|---|---|---|---|
| eval-nbt-add-change | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-add-plain | NC.2.NBT.5 | no | validated | 0 | banned-placeholder x3 (first pass) |
| eval-nbt-add-regroup | NC.2.NBT.5 | no | validated | 0 | banned-placeholder x1 (first pass) |
| eval-nbt-add-start | NC.2.NBT.5 | no | validated | 0 | banned-placeholder x1 (first pass) |
| eval-nbt-sub-change | NC.2.NBT.5 | no | validated | 0 | banned-placeholder x1 (first pass) |
| eval-nbt-sub-plain | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-sub-regroup | NC.2.NBT.5 | no | validated | 0 | banned-placeholder x2 (first pass) |
| eval-nbt-sub-start | NC.2.NBT.5 | no | validated | 0 | banned-placeholder x1 (first pass) |
| eval-nbt-twostep-a | NC.2.NBT.5 | no | validated | 0 | invalid-model-json, retried by design (first pass) |
| eval-nbt-twostep-b | NC.2.NBT.5 | no | validated | 0 | banned-placeholder x2 (first pass) |
| eval-oa-add-change | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-add-result | NC.2.OA.1 | no | validated | 0 | banned-placeholder x2 (first pass) |
| eval-oa-add-start | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-compare-bigger | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-compare-difference | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-compare-smaller | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-take-change | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-take-result | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-take-start | NC.2.OA.1 | no | validated | 0 | invalid-model-json, retried by design (first pass) |
| eval-oa-twostep | NC.2.OA.1 | yes | validated | 0 | - |

## Reading level (Flesch-Kincaid estimate over filled lines of validated drafts)

- Lines measured: 520. Mean grade: -2.5.
- Distribution: 2-3: 17, >3: 25, <=1: 462, 1-2: 16.

## Worst 3 (by first-pass issue count; all finals hold 0 slots)

- eval-nbt-add-plain (validated, 0 slots; 3 first-pass banned-placeholder): {result} in the count hints and choices on a result-unknown story. File: evidence/U15/drafts/eval-nbt-add-plain.draft.json
- eval-nbt-sub-regroup (validated, 0 slots; 2 first-pass banned-placeholder) and eval-nbt-twostep-b (validated, 0 slots; 2 first-pass banned-placeholder), e.g. {result} in the count ask. Files: evidence/U15/drafts/eval-nbt-sub-regroup.draft.json, evidence/U15/drafts/eval-nbt-twostep-b.draft.json
- Remaining 17 tied at 1 or 0 first-pass issues with 0 finals slots.

## Review gate (Anantha, rubric gen/eval/rubric.md)

- [ ] eval-nbt-add-change: evidence/U15/drafts/eval-nbt-add-change.draft.json
- [ ] eval-nbt-add-plain: evidence/U15/drafts/eval-nbt-add-plain.draft.json
- [ ] eval-nbt-add-regroup: evidence/U15/drafts/eval-nbt-add-regroup.draft.json
- [ ] eval-nbt-add-start: evidence/U15/drafts/eval-nbt-add-start.draft.json
- [ ] eval-nbt-sub-change: evidence/U15/drafts/eval-nbt-sub-change.draft.json
- [ ] eval-nbt-sub-regroup: evidence/U15/drafts/eval-nbt-sub-regroup.draft.json
- [ ] eval-nbt-sub-start: evidence/U15/drafts/eval-nbt-sub-start.draft.json
- [ ] eval-nbt-twostep-b: evidence/U15/drafts/eval-nbt-twostep-b.draft.json
- [ ] eval-oa-add-result: evidence/U15/drafts/eval-oa-add-result.draft.json
