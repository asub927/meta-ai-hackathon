#!/usr/bin/env python3
"""Exhaustive checker for the Socratic reducer model (see ../model/SocraticReducer.tla).

Transcribes PLAN.md §2 StepPhase/Event/step for ONE Question:
  telling -> asking -(correct)-> explaining -> done
  asking -(wrong)-> reacting -> asking (smaller question, fresh ladder)
  asking rung 0..3, hint raises rung by 1, rung 3 plays the worked example
  (different numbers, NOT the answer), then the original question is re-asked.
Answered events outside `asking` are no-ops (a double-tap answers only once).
Mastery sub-model: mastered never drops within a session (PLAN.md U26).

Checks, by BFS over every reachable state (no sampling):
  P1 no `say` contains the answer before the child answers correctly
  P2 `done` is reachable from every reachable state
  P3 rung stays in 0..3 and the worked example only follows rung 3
  P4 at most one answer is recorded per question (double-tap safety)
  P5 mastery is monotonic within a session
Then re-runs on three broken mutants; each MUST fail its property.
Exit 0 iff the real model passes all and every mutant is caught.
"""
import sys
from collections import deque

TELLING, ASKING, REACTING, EXPLAINING, DONE = "telling", "asking", "reacting", "explaining", "done"

def transitions(state, mutant=None):
    phase, rung, correct, told, records, ever_worked, ever_rung3 = state
    out = []
    def add(name, s): out.append((name, s))
    if phase == TELLING:
        add("BeatEnded", (ASKING, 0, correct, told, records, ever_worked, ever_rung3))
    if phase == ASKING:
        add("AnswerCorrect", (EXPLAINING, rung, True, told, records + 1, ever_worked, ever_rung3))
        add("AnswerWrongDetected", (REACTING, rung, correct, told, records, ever_worked, ever_rung3))
        add("AnswerWrongUnknown", (REACTING, rung, correct, told, records, ever_worked, ever_rung3))
        if rung < 3:
            nr = rung + 1
            if mutant == "tell-answer" and nr == 3:
                add("Hint(tells answer)", (ASKING, nr, correct, True, records, ever_worked, True))
            else:
                add("Hint", (ASKING, nr, correct, told, records, ever_worked or nr == 3, ever_rung3 or nr == 3))
        else:  # rung == 3: worked example (different numbers) plays, then re-ask
            add("WorkedExampleEnded(re-ask)", (ASKING, 0, correct, told, records, ever_worked, ever_rung3))
    if phase == REACTING and mutant != "stuck-reaction":
        add("ReactionEnded(smaller question)", (ASKING, 0, correct, told, records, ever_worked, ever_rung3))
    if phase == EXPLAINING:
        add("Explained", (DONE, rung, correct, told, records, ever_worked, ever_rung3))
    for p in (TELLING, REACTING, EXPLAINING, DONE):
        if phase == p:
            add("AnsweredDuplicate(no-op)", state)  # double-tap: ignored, records unchanged
    return out

def mastery_transitions(state, mutant=None):
    streak, mastered, review_due = state  # streak capped at 3
    out = []
    out.append(("CleanAnswer", (min(streak + 1, 3), mastered or streak + 1 >= 3, review_due)))
    drop = False if mutant != "mastery-drops" else mastered
    out.append(("Mistake", (0, mastered and not drop, review_due or mastered)))
    out.append(("HintedAnswer(not clean)", (0, mastered, review_due)))
    return out

def bfs(init, step):
    seen, q, edges = {init}, deque([init]), {}
    while q:
        s = q.popleft()
        edges[s] = step(s)
        for _, t in edges[s]:
            if t not in seen:
                seen.add(t); q.append(t)
    return seen, edges

def can_reach_done(states, edges):
    rev = {s: [] for s in states}
    for s, outs in edges.items():
        for _, t in outs: rev[t].append(s)
    ok, q = set(), deque([s for s in states if s[0] == DONE])
    ok.update(q)
    while q:
        for p in rev[q.popleft()]:
            if p not in ok: ok.add(p); q.append(p)
    return ok

def check(mutant=None):
    init = (TELLING, 0, False, False, 0, False, False)
    states, edges = bfs(init, lambda s: transitions(s, mutant))
    reach = can_reach_done(states, edges)
    results = {
        "P1 tutor never states the answer before a correct answer": not any(s[3] for s in states),
        "P2 done reachable from every reachable state": all(s in reach for s in states),
        "P3 rung in 0..3; worked example only after rung 3": all(0 <= s[1] <= 3 and (not s[5] or s[6]) for s in states),
        "P4 at most one answer recorded (double-tap answers once)": all(s[4] <= 1 for s in states),
    }
    minit = (0, False, False)
    mstates, _ = bfs(minit, lambda s: mastery_transitions(s, mutant))
    results["P5 mastery never drops within a session"] = all(
        not (a[1] and not b[1]) for a in mstates for _, b in mastery_transitions(a, mutant))
    detail = f"{len(states)} reducer states, {len(mstates)} mastery states"
    return results, detail

def main():
    ok = True
    results, detail = check()
    print(f"MAIN MODEL ({detail})")
    for k, v in results.items():
        print(f"  {'PASS' if v else 'FAIL'}  {k}"); ok &= v
    for mutant, prop in [("tell-answer", "P1"), ("stuck-reaction", "P2"), ("mastery-drops", "P5")]:
        r, d = check(mutant)
        caught = not r[next(k for k in r if k.startswith(prop))]
        print(f"MUTANT {mutant} ({d}): {'CAUGHT (expected)' if caught else 'NOT CAUGHT — checker is blind!'}")
        ok &= caught
    print("RESULT:", "PASS — model holds, all mutants caught" if ok else "FAIL")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
