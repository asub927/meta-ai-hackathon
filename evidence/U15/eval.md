# U15 evidence — generator eval

Model: muse-spark-1.3-contributor. Specs: 20.

## Rates

- First-pass validated: 18/20.
- Validated after retry: 20/20.
- Human slots total: 0.
- Issue codes: missing-reaction x5 (4 on eval-nbt-twostep-a, 1 on
  eval-oa-take-start, both on the first pass only); all other specs none.
  Source: gen/out/eval/*.slots.json intermediates; all 20 final drafts
  carry zero issues.

## Table

| spec | standard | first pass | final | slots | codes |
|---|---|---|---|---|---|
| eval-nbt-add-change | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-add-plain | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-add-regroup | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-add-start | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-sub-change | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-sub-plain | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-sub-regroup | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-sub-start | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-nbt-twostep-a | NC.2.NBT.5 | no | validated | 0 | missing-reaction x4 (first pass) |
| eval-nbt-twostep-b | NC.2.NBT.5 | yes | validated | 0 | - |
| eval-oa-add-change | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-add-result | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-add-start | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-compare-bigger | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-compare-difference | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-compare-smaller | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-take-change | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-take-result | NC.2.OA.1 | yes | validated | 0 | - |
| eval-oa-take-start | NC.2.OA.1 | no | validated | 0 | missing-reaction x1 (first pass) |
| eval-oa-twostep | NC.2.OA.1 | yes | validated | 0 | - |

## Reading level (Flesch-Kincaid estimate over filled lines of validated drafts)

- Lines measured: 400. Mean grade: -2.1.
- Distribution: 2-3: 17, >3: 24, <=1: 345, 1-2: 14.

## Worst 3 (by first-pass slot count; all finals hold 0 slots)

- eval-nbt-twostep-a (validated, 0 slots; 4 first-pass slots): missing-reaction x4. File: evidence/U15/drafts/eval-nbt-twostep-a.draft.json
- eval-oa-take-start (validated, 0 slots; 1 first-pass slot): missing-reaction x1. File: evidence/U15/drafts/eval-oa-take-start.draft.json
- Remaining 18 tied at 0 first-pass slots and 0 issues, e.g. eval-nbt-add-change (validated, 0 slots): -. File: evidence/U15/drafts/eval-nbt-add-change.draft.json

## Review gate (Anantha, rubric gen/eval/rubric.md)

- [ ] eval-nbt-add-change: evidence/U15/drafts/eval-nbt-add-change.draft.json
- [ ] eval-nbt-add-plain: evidence/U15/drafts/eval-nbt-add-plain.draft.json
- [ ] eval-nbt-add-regroup: evidence/U15/drafts/eval-nbt-add-regroup.draft.json
- [ ] eval-nbt-add-start: evidence/U15/drafts/eval-nbt-add-start.draft.json
- [ ] eval-nbt-sub-change: evidence/U15/drafts/eval-nbt-sub-change.draft.json
