# U5 evidence — Socratic reducer, choreograph, conformance vectors

Backfill per docs/evidence-backfill-plan.md EB3. PLAN.md U5 sets the
acceptance. Right answer moves asking to explaining to done. Each detected
misconception moves reacting to asking on the smaller question. Three hints
and still stuck plays the worked example, then re-asks. No say effect holds
the answer early. Double-tap answers once. Unknown answers fall back to
count-together. Choreograph is deterministic and vectors match in Node and
WebKit byte for byte (PLAN.md:405-418). Verify by socratic tests plus vectors
with no diff (PLAN.md:415).

## Commands, all exit 0, run 2026-10-31 on this machine

- `pnpm --filter @kids-math/conformance run vectors`. Regenerates
  `packages/conformance/vectors/*.json` from the builders. 1 passed.
- `pnpm --filter @kids-math/conformance test`. 2 files, 5 passed
  (generate 1, step 1, detect 1, fill 1, choreograph 1). The conformance test
  asserts committed vectors equal `canonicalJson(build())` byte for byte for
  all four kinds, plus version 1, kind match, nonempty ids, unique ids.
- `pnpm --filter @kids-math/core test`. 6 files, 71 passed (evaluate 11,
  validate 11, lesson 4, fixtures 18, core 16, u5 11). Includes the
  10,000-case solver oracle and the U5 reducer and property tests.
- `pnpm -r typecheck`. Clean for packages/core, packages/conformance,
  apps/web.

## Determinism proof

The vectors command ran twice in a row. SHA-256 of all four files identical
across both runs, so generation is idempotent at this tree. `git diff`
against HEAD is not empty. `step.json` differs. That diff predates this
backfill and reflects the smaller-question addition to reactions (`smaller`
objects on reacting states, `template` on record effects, one corrected say
line). The regeneration is the sanctioned writer and the conformance check
passes against the regenerated output.

## Vector file SHAs, post-run working tree

- choreograph.json `6d2c7318d99d6469e11464e09e7bb5a477acd71e50ea3f163f3eb95d622eca32`
- detect.json `dfb33e90cdf2c67420220f5e79182c632571b7c6b87d767ea6c83994fa56f5ec`
- fill.json `4a77a3fdbd5164211b5a5021a981ee70a3d31fb4d93e9926686d6b5c8ed2eba4`
- step.json `7d4a6ba16dd7c7da1144a13d59d47617381037a76bc02242f6ea3a9a31bf6f2f`

Correction 2026-10-31: the first-published SHAs for fill.json and step.json
did not reproduce. Two consecutive regen runs after the backfill both
produce the values above, and the conformance suite passes against them, so
these replace the earlier table.

## Plan lines satisfied

EB3 lanes 2 through 6 (vectors generate, step, detect, fill, choreograph byte
equality via the conformance suite). Lane 1 trunk regression is partial. No
trunk run was done. The byte-equality check above is the head-side proof.
Lane 10 scope. This unit adds this report and evidence/U6/report.md only.
Other working-tree modifications predate it.

## Review gate

None. EB3 is not review-gated.
