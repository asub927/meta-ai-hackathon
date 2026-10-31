# Evidence backfill plan

Six stacked PRs close the U5 through U12 evidence gap and record the U1 through U3 scope decision. Docs first, then tooling, then regenerated evidence. Anantha lands every PR.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `pstack/skills/poteto-mode/playbooks/autopilot-stack.md`. The operator lands the PRs bottom-up. EB1 and EB2 stop at verified first. EB3 through EB6 stack on EB2 and restack as it lands.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] Read these from trunk at program start. Re-read them at every tick.
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `git show origin/main:pstack/skills/swarm/SKILL.md`
  - [ ] `git show origin/main:apps/web/playwright.config.ts`
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `git show origin/main:pstack/skills/poteto-mode/scripts/check-plan.mjs`
- [ ] On the operator's go, arm the audit tick as `/loop 1h` with the tick prompt below. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk. Audit the operation against it and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then post a short status message to the operator in chat only when the audit found a tracked change that no earlier status message reported, such as a PR opened, a code-ready head, a round launched or closed, a verdict, a merge, a stuck agent and the action taken, a blocker added or cleared, or a decision only the operator can make. Name every such change and nothing else. Do not repeat a table, the merged list, or an unchanged blocker. If the audit found none, end the turn with no reply text. Either way, log this tick's row in your decision trail. The row names the items reported, or none."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names.
- [ ] Follow this dependency graph. Start dependent work only after its parent merges, or base it on the parent branch when the execution playbook stacks.
  - [ ] EB1 and EB2 are independent and first. Both branch from `main`.
  - [ ] EB3 after EB2. EB4 after EB2. EB5 after EB2. EB6 after EB5.
- [ ] Hold the file boundaries. EB1 touches only `docs/DECISIONS-LOG.md`. EB2 touches only `apps/web/package.json` plus one docs note. EB3 touches only `evidence/U5/` and `evidence/U6/`. EB4 touches only `evidence/U7/` and `evidence/U8/`. EB5 touches only `evidence/U9/`, `evidence/U10/`, `evidence/U11/`. EB6 touches only `evidence/U12/`.
- [ ] Hold the review gate. No EB PR changes an interaction. Every PR below writes Review gate None. The standing Anantha gates for U7 through U9 and U12 stay open and are tracked in Appendix C.

### PR mechanics, for every PR

- [ ] Resolve the forge once. Default to `gh`; if `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation. Record any fallback to `gh`. Never require `gt`.
- [ ] Open the PR ready, never draft, per **Opening a PR**. Use the run's built-in PR tool when it has one, else `origin pr create --status open --base <base-branch>` or `gh pr create --base <base-branch>` according to the resolved forge. A stack child targets its parent branch.
- [ ] Run the repo's lint and typecheck once before the PR-facing push. Push with hooks on.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every Bugbot and security-reviewer comment per `../references/bugbot-triage.md`.
- [ ] Rebase onto current trunk before the code-ready report and babysit. Keep that merge base in fix rounds. Rebase again only at merge prep, on a `git merge-tree` conflict with trunk, on a CI failure that comes from a change on trunk, or when a known concurrent change to the same files lands.

### Verdict and merge, for every PR

- [ ] A full swarm runs once, at the code-ready head. Another full swarm runs only for new behavior, a redesign, or a large new diff. A rebase, a merge-conflict resolution, or a minor fix gets a single verifier at the new head, and a wording-only change gets none. Run each full swarm per `pstack/skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block. Two or more audit lanes, each with its own focus, that read the diff and the receipts and distrust the PR body. The root audits the receipts in the merge-ready report before the verdict.
- [ ] Judge every finding by the execution playbook's blocking rule. The verdict is clean when none blocks. A failure on trunk behavior in a lane marked `Regression lane against trunk.` is recorded against trunk and does not block the PR. A new head gets a fresh verdict, except for results that stay valid under the patch-id rule in `playbooks/shipping.md`.
- [ ] Stop at verified per autopilot-stack. Post each PR with its verdict and hand the stack to the operator. Nobody pushes after handoff without the operator's go. A new head on a lower PR restacks the PRs above it, and a PR whose `git patch-id` the restack leaves unchanged keeps its verdict.

### Boot recipe, for every live lane

Each live lane runs in its own worktree at the PR head. No cloud VMs exist in this environment, so lanes run locally per the adaptation in Appendix C.

- [ ] `git fetch origin <head-branch> && git worktree add /tmp/lane-<pr-id>-<n> <head-SHA>`.
- [ ] Install once per lane with `pnpm install` only if `node_modules` is absent. Start nothing else until the lane needs it.
- [ ] Start the web build or dev server only for lanes that drive the browser. Wait for the ready log line before driving.
- [ ] Deliver input only through Playwright commands. Read-only diagnostics are console logs and DOM reads.
- [ ] Save every screenshot to `/tmp/lane-<pr-id>-<n>/<slug>.png` and return the paths with the report.

## Record the U1 through U3 scope decision (EB1)

**Depends on.** None. First PR. Branches from `main`.

**Files.**

- [ ] Edit `docs/DECISIONS-LOG.md`. Append entries 17 and 18 in the existing numbered style.
- [ ] Create no other file. Touch no code.

Note: these entries landed as 12 through 15 instead of 17 and 18. Content matches. Lane text below still says 17 and 18.

**Build.**

- [ ] Entry 17 retires the U1, U2, U2b, and U2c spikes. It records WAAPI as the settled default per the licence decision, notes that no bakeoff table exists, and names the risk that a future feel regression reopens the question.
- [ ] Entry 18 restates the evidence rule for U15a onward. It names this plan as the backfill vehicle and lists the standing Anantha gates that stay open.

**You see.**

- [ ] `git diff --stat` shows one file. The two entries render under their numbers with dates.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] No unit test covers a docs edit. Run the repo typecheck to prove nothing else moved. Run `pnpm -r typecheck`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet medium` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Render `docs/DECISIONS-LOG.md` at trunk and head and diff the visible text outside the two new entries. Save `eb1-regression.png`. Pass when only entries 17 and 18 differ.
- [ ] Lane 2. Entry 17 names U1, U2, U2b, and U2c each by id. Save `eb1-entry17-ids.log`. Pass when all four ids appear in the entry text.
- [ ] Lane 3. Entry 17 states WAAPI as the settled default. Save `eb1-entry17-waapi.log`. Pass when the entry names WAAPI and the licence reason.
- [ ] Lane 4. Entry 17 names the reopen risk. Save `eb1-entry17-risk.log`. Pass when a feel regression is named as the trigger.
- [ ] Lane 5. Entry 18 restates the evidence rule in one sentence. Save `eb1-entry18-rule.log`. Pass when the entry names `evidence/<unit>/` and the three check types.
- [ ] Lane 6. Entry 18 points at this plan file. Save `eb1-entry18-plan.log`. Pass when the plan path appears and resolves.
- [ ] Lane 7. Entry 18 lists the standing Anantha gates. Save `eb1-entry18-gates.log`. Pass when U7 through U9 and U12 gates all appear.
- [ ] Lane 8. Entry numbers stay sequential with no gaps from 16. Save `eb1-numbering.log`. Pass when the log shows 17 then 18.
- [ ] Lane 9. No line exceeds the repo markdown width used by neighboring entries. Save `eb1-width.log`. Pass when the longest new line is at most as long as the longest old line.
- [ ] Lane 10. `git status --short` shows only `docs/DECISIONS-LOG.md`. Save `eb1-scope.log`. Pass when the file boundary holds.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Typecheck wall time at trunk and head plus the count of files changed.
- [ ] Probe. Run `pnpm -r typecheck` at trunk then head, interleaved, and record seconds each.
- [ ] Baseline. Record the trunk seconds first.
- [ ] Rule. Head typecheck passes and head wall time stays within twice the trunk value. Files changed equal 1.

**Review gate.** None. EB1 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The owner hands EB1 to the operator at verified. The operator lands it.

## Wire the missing verify names (EB2)

**Depends on.** None. First PR alongside EB1. Branches from `main`.

**Files.**

- [ ] Edit `apps/web/package.json`. Add `verify:interact` running the interact spec and `verify:audio` running the audio spec.
- [ ] Create `docs/verify-map.md`. Map every PLAN.md verify name to the exact command that runs it and mark the ones that stay unwired.

**Build.**

- [ ] `verify:interact` runs `playwright test e2e/interact.spec.ts` across the configured projects.
- [ ] `verify:audio` runs `playwright test e2e/audio.spec.ts` across the configured projects.

**You see.**

- [ ] `pnpm --filter web run verify:interact -- --list` prints the interact spec titles. The audio alias does the same for its spec.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Run the web unit suite with `pnpm --filter web test`. It passes with no new failures against trunk.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet medium` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the web unit suite at trunk and head and compare pass counts. Save `eb2-regression.png`. Pass when head passes at least as many as trunk.
- [ ] Lane 2. The interact alias lists the tap-15 test. Save `eb2-interact-list.log`. Pass when the title appears in list output.
- [ ] Lane 3. The interact alias lists the drag-3 test. Save `eb2-drag-list.log`. Pass when the title appears in list output.
- [ ] Lane 4. The interact alias lists the 64px target test. Save `eb2-targets-list.log`. Pass when the title appears.
- [ ] Lane 5. The interact alias lists portrait and landscape overlap tests. Save `eb2-overlap-list.log`. Pass when both orientations appear.
- [ ] Lane 6. The audio alias lists the unlock test. Save `eb2-audio-list.log`. Pass when the Start-tap unlock title appears.
- [ ] Lane 7. The audio alias lists the resume test. Save `eb2-resume-list.log`. Pass when the visibility resume title appears.
- [ ] Lane 8. The audio alias lists the cue log test. Save `eb2-cue-list.log`. Pass when the cue log title appears.
- [ ] Lane 9. The map doc covers every PLAN.md verify name from U3 through U12a. Save `eb2-map-coverage.log`. Pass when each name appears with a command or an explicit unwired mark.
- [ ] Lane 10. The map marks `proto:bench`, `verify:input`, and `coverage:content` as unwired, `verify:fps` as chromium-pinned, and `verify:seek` as wired. Save `eb2-map-gaps.log`. Pass when all five appear with those marks.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Web unit suite wall time at trunk and head.
- [ ] Probe. Run `pnpm --filter web test` at trunk then head, interleaved, and record seconds each.
- [ ] Baseline. Record the trunk seconds first.
- [ ] Rule. Head passes fully and head wall time stays within twice the trunk value.

**Review gate.** None. EB2 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The owner hands EB2 to the operator at verified. The operator lands it before EB3 through EB6 restack onto trunk.

## Backfill U5 and U6 evidence (EB3)

**Depends on.** EB2. Stacks on the EB2 branch until EB2 lands, then restacks onto trunk.

**Files.**

- [ ] Create `evidence/U5/report.md` with the vectors command, the pass counts, and the vector file SHAs.
- [ ] Create `evidence/U6/report.md` with the beats totals, the seek hashes, and the no-gsap grep output.

**Build.**

- [ ] Run `pnpm --filter @kids-math/conformance run vectors` then `git diff --exit-code` on the vector files to prove determinism.
- [ ] Run the beats path of `e2e/lesson.spec.ts` and record the `[24,15,20]` totals. Restore `evidence/U0/*.png` afterward if bytes match trunk, so the U0 boundary holds.

**You see.**

- [ ] `evidence/U5/report.md` shows green vectors and four vector SHAs. `evidence/U6/report.md` shows the beats totals and a clean no-gsap grep.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Run `pnpm -r test` and `pnpm -r typecheck`. Both pass fully at the head.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet medium` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the conformance spec at trunk and head and compare byte equality results. Save `eb3-regression.png`. Pass when both agree on all four vector files.
- [ ] Lane 2. Vectors generate with no diff at head. Save `eb3-vectors.log`. Pass when `git diff --exit-code` exits 0.
- [ ] Lane 3. The step vectors match Node and WebKit byte for byte. Save `eb3-step-vectors.log`. Pass when the conformance run reports equality.
- [ ] Lane 4. The detect vectors match. Save `eb3-detect-vectors.log`. Pass when the run reports equality.
- [ ] Lane 5. The fill vectors match. Save `eb3-fill-vectors.log`. Pass when the run reports equality.
- [ ] Lane 6. The choreograph vectors match. Save `eb3-choreograph-vectors.log`. Pass when the run reports equality.
- [ ] Lane 7. The beats run prints the `[24,15,20]` totals. Save `eb3-beats-totals.log`. Pass when the totals appear exactly.
- [ ] Lane 8. The beats screenshots match trunk bytes or the drift is filed as a finding. Save `eb3-beats-shots.png`. Pass when bytes match or a drift note exists in the report.
- [ ] Lane 9. No gsap import remains outside `motion/`. Save `eb3-no-gsap.log`. Pass when the grep output is empty.
- [ ] Lane 10. `git status --short` shows only `evidence/U5/` and `evidence/U6/`. Save `eb3-scope.log`. Pass when the file boundary holds.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Full `pnpm -r test` wall time at trunk and head.
- [ ] Probe. Run the suite at trunk then head, interleaved, and record seconds each.
- [ ] Baseline. Record the trunk seconds first.
- [ ] Rule. Head passes fully and head wall time stays within twice the trunk value.

**Review gate.** None. EB3 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The owner hands EB3 to the operator at verified. The operator lands it.

## Backfill U7 and U8 evidence (EB4)

**Depends on.** EB2. Stacks on the EB2 branch until EB2 lands, then restacks onto trunk.

**Files.**

- [ ] Create `evidence/U7/report.md` with target sizes, overlap minimums, and the orientation matrix.
- [ ] Create `evidence/U8/report.md` with per-reaction staged numbers and the never-wrong lint output.

**Build.**

- [ ] Run the new `verify:interact` alias and save the console log plus screenshots for the 64px and overlap asserts.
- [ ] Run `e2e/react.spec.ts` and `lint:never-wrong`, and record the staged counts for 33, 9, 25, and 14.

**You see.**

- [ ] `evidence/U7/report.md` shows 64px minimums and zero overlaps in both orientations. `evidence/U8/report.md` shows the four staged counts and a clean lint. Screenshots for both sit beside the reports for the standing Anantha gates, which stay open until Anantha closes them in chat.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Run `pnpm --filter web test` and `lint:never-wrong`. Both pass at the head.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet medium` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the interact spec at trunk and head and compare pass counts. Save `eb4-regression.png`. Pass when head passes at least as many as trunk.
- [ ] Lane 2. Tap-15 counters answer through real pointer events. Save `eb4-tap.png`. Pass when the emitted answer matches the tapped count.
- [ ] Lane 3. Drag-3 completes to the tray. Save `eb4-drag.png`. Pass when the tray count updates.
- [ ] Lane 4. Every target measures 64px or more. Save `eb4-targets.png`. Pass when the smallest target clears 64px.
- [ ] Lane 5. Portrait layout shows no overlap of counter, bubble, and input. Save `eb4-portrait.png`. Pass when the overlap check reports zero.
- [ ] Lane 6. Landscape layout shows no overlap. Save `eb4-landscape.png`. Pass when the overlap check reports zero.
- [ ] Lane 7. Reaction 33 stages the book count at 33 with the real start on the counter. Save `eb4-react33.png`. Pass when both numbers read correctly.
- [ ] Lane 8. Reactions 9, 25, and 14 stage their counts. Save `eb4-react-rest.png`. Pass when each staged count matches the log.
- [ ] Lane 9. The never-wrong lint passes over the built bundle path set. Save `eb4-lint.log`. Pass when the lint exits 0.
- [ ] Lane 10. `git status --short` shows only `evidence/U7/` and `evidence/U8/`. Save `eb4-scope.log`. Pass when the file boundary holds.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Tap-to-feedback milliseconds plus interact suite wall time, at trunk and head.
- [ ] Probe. Measure feedback latency on the tap widget and run the interact suite at trunk then head, interleaved.
- [ ] Baseline. Record the trunk latency and trunk suite seconds first.
- [ ] Rule. Head feedback lands under 100ms and head suite time stays within twice the trunk value.

**Review gate.** None. EB4 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The owner hands EB4 to the operator at verified. The operator lands it.

## Backfill U9 through U11 evidence (EB5)

**Depends on.** EB2. Stacks on the EB2 branch until EB2 lands, then restacks onto trunk.

**Files.**

- [ ] Create `evidence/U9/report.md` with rung order, visual cue numbers, and the strategy event dump.
- [ ] Create `evidence/U10/report.md` with the unlock state log, the resume trace, and the cue offsets.
- [ ] Create `evidence/U11/report.md` with the offline reload result, the resume phase, and the export round-trip checksum.

**Build.**

- [ ] Run `e2e/hints.spec.ts` and record rung order plus the worked-example numbers.
- [ ] Run the new `verify:audio` alias and save the cue log, then diff cue names and counts against the U3 baseline of 58 cues.
- [ ] Run `e2e/shell.spec.ts` offline and save the export file with its checksum line plus the round-trip comparison.

**You see.**

- [ ] The U9 report shows rungs in order with the worked numbers separate from the problem numbers. The U10 report shows running audio after Start and a nonempty cue log. The U11 report shows a clean reload resume and an identical round-trip import.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Run `pnpm --filter web test`. It passes fully at the head.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet medium` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the hints spec at trunk and head and compare pass counts. Save `eb5-regression.png`. Pass when head passes at least as many as trunk.
- [ ] Lane 2. Rungs appear in question, visual, worked order. Save `eb5-rungs.png`. Pass when the DOM order matches the ladder.
- [ ] Lane 3. The worked example uses its own numbers on a separate stage. Save `eb5-worked.png`. Pass when no worked number equals a problem number.
- [ ] Lane 4. The chosen strategy reaches IndexedDB as a LocalEvent. Save `eb5-strategy.log`. Pass when the event dump holds the strategy with no free text.
- [ ] Lane 5. Audio state reads running after the Start tap. Save `eb5-unlock.png`. Pass when the state log shows running.
- [ ] Lane 6. Audio resumes after background and foreground. Save `eb5-resume.log`. Pass when cues fire after the resume event.
- [ ] Lane 7. Cue names and counts match the 58-cue baseline. Save `eb5-cues.log`. Pass when the diff is empty.
- [ ] Lane 8. Airplane-mode reload resumes at the same question. Save `eb5-offline.png`. Pass when the phase matches pre-kill state.
- [ ] Lane 9. Export then import on a fresh profile reproduces identical derived progress. Save `eb5-roundtrip.log`. Pass when the comparison reports identical.
- [ ] Lane 10. `git status --short` shows only `evidence/U9/`, `evidence/U10/`, and `evidence/U11/`. Save `eb5-scope.log`. Pass when the file boundary holds.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Hints plus shell suite wall time at trunk and head.
- [ ] Probe. Run both specs at trunk then head, interleaved, and record seconds each.
- [ ] Baseline. Record the trunk seconds first.
- [ ] Rule. Head passes fully and head wall time stays within twice the trunk value.

**Review gate.** None. EB5 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The owner hands EB5 to the operator at verified. The operator lands it.

## Backfill U12 runnable acceptance (EB6)

**Depends on.** EB5. Stacks on the EB5 branch until EB5 lands, then restacks onto trunk.

**Files.**

- [ ] Create `evidence/U12/paths-report.md` with per-path results for the all-right, one-misconception, and all-hints runs plus console error counts.
- [ ] Create no video files. Video, fps table, and real-iPad approval stay with Anantha and are tracked in Appendix C.

**Build.**

- [ ] Run `e2e/lesson1.spec.ts` for all three child paths over the full 5-story lesson.
- [ ] Run `npm run validate` over the lesson file and record the clean result.

**You see.**

- [ ] The paths report shows three green paths with zero console errors. The validate log shows a clean lesson file.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Run `pnpm -r test` and `pnpm -r typecheck`. Both pass fully at the head.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet medium` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the all-right path at trunk and head and compare completion states. Save `eb6-regression.png`. Pass when both reach the lesson done state.
- [ ] Lane 2. The all-right path finishes all 5 stories. Save `eb6-path-right.png`. Pass when the done marker appears.
- [ ] Lane 3. The one-misconception path finishes all 5 stories. Save `eb6-path-mis.png`. Pass when the done marker appears.
- [ ] Lane 4. The all-hints path finishes all 5 stories. Save `eb6-path-hints.png`. Pass when the done marker appears.
- [ ] Lane 5. Zero console errors across all three paths. Save `eb6-console.log`. Pass when the error count is 0.
- [ ] Lane 6. Every story ends on the written equation. Save `eb6-equation.png`. Pass when the equation shows at each story end.
- [ ] Lane 7. Read-aloud covers every line in the stubbed speech run. Save `eb6-speech.log`. Pass when each line has a voice log entry.
- [ ] Lane 8. The lesson validates clean. Save `eb6-validate.log`. Pass when the CLI exits 0.
- [ ] Lane 9. The event log exports and re-imports for the lesson run. Save `eb6-log.log`. Pass when the round trip matches.
- [ ] Lane 10. `git status --short` shows only `evidence/U12/`. Save `eb6-scope.log`. Pass when the file boundary holds.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Three-path suite wall time at trunk and head.
- [ ] Probe. Run `lesson1.spec.ts` at trunk then head, interleaved, and record seconds each.
- [ ] Baseline. Record the trunk seconds first.
- [ ] Rule. Head passes fully and head wall time stays within twice the trunk value. The 58fps bar stays with the real-iPad gate in Appendix C.

**Review gate.** None. EB6 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The owner hands EB6 to the operator at verified. The operator lands it.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

No prototype ran for this plan. The open questions were settled by direct reads, not builds. The recon mapped every verify script, all eight Playwright specs, the four package.json files, and the evidence conventions of U0 and U12 through U15, and it recorded the branch and doc states above. What stays unproven is whether the WebKit binary exists in the Playwright cache (the doctor decides at EB3 start), whether Chromium and ffmpeg exist for any render rerun (not needed by any EB PR), and whether live gateway secrets are present (only the cached replay path is used, so absence does not block).

## Appendix B. Alternatives rejected

A single backfill PR for U5 through U12 lost to six small PRs, because one unit per PR keeps each verdict tied to one rerun command and lets the operator land the docs decision before any evidence lands. A full U1 and U2 rebuild lost to a written retirement, because the plan preselected WAAPI and the widget already shipped, so rerunning dead spikes buys no decision. A regeneration of U13 through U15 evidence lost to leaving it alone, because that evidence already exists. Backfilling with new video capture wiring lost to screenshot and log evidence, because the specs record no video and new harness code would turn a backfill into a feature.

## Appendix C. Risks

Each risk names the PR it lands in and what the owner watches. The boot recipe adaptation (local worktrees instead of cloud VMs) affects every PR, because no cloud runner exists in this environment. Lanes run serially where the machine cannot parallelize browsers, and the owner records that in the merge-ready report.

The WebKit binary risk lands in EB3. If the doctor fails on a missing binary, the owner installs it with the documented Playwright install command and reruns. If install is impossible on this machine, WebKit lanes convert to Chromium-only with the gap named in the report, and the standing gates stay open.

The beats PNG boundary risk lands in EB3. The beats test writes into `evidence/U0/`. The owner restores those files when bytes match trunk. A mismatch is filed as behavior drift and stops the PR, because silent U0 churn is worse than a gap.

The standing Anantha gates risk spans EB4, EB5, and EB6. Screenshots ship beside the reports, but only a real-iPad session with Anantha closes the U7 through U9 review gates and the U12 acceptance gate. The owner tracks them as open in every status message until Anantha closes them in chat.

The live gateway risk touches no EB PR, because every rerun uses cached replay. If a spec needs a fresh gateway call, the owner records the miss in the report instead of blocking on secrets.

## Appendix D. Links and reading list

Read PLAN.md sections 2, 4, and 5 plus `docs/DECISIONS-LOG.md` before editing. The EB1 owner reads the full decisions log. The EB2 owner reads `apps/web/package.json` and `apps/web/playwright.config.ts`. The EB3 through EB6 owners get `pstack/skills/how/SKILL.md` for the subsystem each spec drives. No PR gets `pstack/skills/interrogate/SKILL.md`, because no design is contested. The trail follows `pstack/skills/show-me-your-work/SKILL.md` with one row per tick in the program status message.
