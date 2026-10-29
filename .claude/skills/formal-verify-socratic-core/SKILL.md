---
name: formal-verify-socratic-core
description: "Formally verify the Socratic core invariants (tutor never states the answer, every path reaches done, hint ladder shape, double-tap safety, mastery never drops in a session) over the reducer model in PLAN.md §2. Use when a change touches StepPhase/Event/step semantics, the hint ladder, reactions, or mastery/review in PLAN.md, docs/STACK.md, or (once built) packages/core."
---

# Formal verification: Socratic core (design model)

> **Scope honesty:** at sync commit `ed9421f` there is no code — this verifies the *design model* transcribed from `PLAN.md` §2 (`StepPhase`, `Event`, `step`, lines 211–222) and the hard tutor rules (PLAN.md lines 28–32, 55–61), exactly as `docs/STACK.md` §2 prescribes ("the pstack `statechart` skill can model-check the flow in TLA+… every path reaches `done`, no `say` contains the answer"). When `packages/core` lands, re-point the model at `socratic/step.ts`, re-run, and only then move the sync commit below forward.

## The properties (plain words)

Harm first: if the tutor ever states the answer, the product's core promise ("Pip asks, the child works it out") is broken in a way spot-check tests rarely catch, because it only shows on deep hint paths.

- **P1 — Tutor never tells.** No `say` effect contains the answer before the child answers correctly. (The worked example at rung 3 uses a different story and different numbers — enforced by `lesson/validate` — so it does not tell.)
- **P2 — Every path finishes.** From every reachable state, `done` is reachable: no hint/reaction loop can trap a child forever.
- **P3 — Hint ladder shape.** Rung stays in 0..3, climbs one at a time, and the worked example only ever follows rung 3; after it, the original question is re-asked.
- **P4 — Double-tap answers once.** `answered` events outside `asking` change nothing and record nothing.
- **P5 — Mastery never drops in a session.** Once `mastery(log)` says mastered, a later mistake schedules review but never un-masters (PLAN.md U26).

## Run it (one command)

```bash
python3 .claude/skills/formal-verify-socratic-core/scripts/check_model.py
```

Stdlib-only Python exhaustive BFS over the finite model — *every* reachable state and transition, no sampling. It prints PASS/FAIL per property, then re-runs three broken mutants (`tell-answer`, `stuck-reaction`, `mastery-drops`) which **must** be caught; exit 0 only if the real model passes all five and all mutants are caught. Cheap (< 1 s) — run it on every change touching the covered design/code.

Canonical spec: `model/SocraticReducer.tla` (same transitions, for TLC). No Java runtime is installed on this machine, so TLC cannot run today; when it can, run TLC on the `.tla` and read every result — passes and counterexamples — with the pstack `/statechart` skill (refer to it by name; copy none of its commands here). The Python checker and the TLA+ must stay transition-for-transition identical; a change to one without the other is a verification bug.

## Coverage record

- **Covered:** `PLAN.md` §2 reducer types + U5 acceptance (lines 211–222, 405–418), tutor rules (28–53), mastery/review (55–61); `docs/STACK.md` §1–2 derived-view claims.
- **Last confirmed against:** commit `ed9421f` (2026-10-29, design docs only).
- **Abstracted (state this when reporting):** one `Question` (a 5-story lesson is repetition of this flow); the smaller follow-up question after a reaction is modeled as a fresh ladder (`rung` reset); misconception *detectors* are collapsed to wrong-detected vs wrong-unknown (both react); `Count`/numbers are not modeled (that is `solve`/`validate`'s exhaustive detector sweep, STACK.md §1, a different check); mastery is the 3-clean-in-a-row rule with session monotonicity only — review intervals (1/3/7/21 days), templates, and cross-session behavior are **not** verified here.
- **Not covered:** content validation, numbers/branding, BeatScript timing, UI, storage, iOS parity.

## Reading a failure

- A **P1/P3/P5 failure on the main model** = the design (or later, the code) breaks a hard tutor rule. Report the shortest counterexample as steps in the code's words (e.g. "asking rung 2 → hint → say contains answer"), name the file/line that introduced the transition, and stop: do not weaken the property or the model until it passes, and do not edit product code unless the user asks.
- A **failure only in the Python checker but not the TLA+** (or vice versa) = modeling drift between the two transcriptions; fix the transcription that diverges from `PLAN.md` §2.
- A **mutant not caught** = the checker went blind; the run fails and this skill needs fixing before any result is trusted.
- After any intended semantics change (PLAN.md first, via the Scribe/DECISIONS-LOG), update the model, the checker, and this coverage record together, re-run, then move the sync commit forward.

Maintenance: `/pstack:maintain-formal-verification-skill` after changes that did not recheck this.
