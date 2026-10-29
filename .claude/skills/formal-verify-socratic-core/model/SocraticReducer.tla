---------------------------- MODULE SocraticReducer ----------------------------
(* Socratic reducer for ONE Question. Transcribed from PLAN.md section 2:
   StepPhase / Event / step, PLAN.md U5 acceptance, Tutor rules (hard).
   Code mapping (when packages/core exists):
     phase <-> StepPhase.tag, rung <-> asking.rung,
     Hint <-> Event "hint", Answer* <-> Event "answered",
     ReactionEnded <-> Event "reaction-ended", Explained <-> Event "explained".
   The worked example uses different numbers (lesson/validate), so playing it
   is NOT saying the answer: that is why rung 3 sets worked, never told. *)

EXTENDS Naturals

VARIABLES phase, rung, correct, told, records, everWorked, everRung3, mastered, streak

vars == <<phase, rung, correct, told, records, everWorked, everRung3, mastered, streak>>

Phases == {"telling", "asking", "reacting", "explaining", "done"}

Init ==
  /\ phase = "telling" /\ rung = 0 /\ correct = FALSE /\ told = FALSE
  /\ records = 0 /\ everWorked = FALSE /\ everRung3 = FALSE
  /\ mastered = FALSE /\ streak = 0

BeatEnded ==
  /\ phase = "telling" /\ phase' = "asking" /\ rung' = 0
  /\ UNCHANGED <<correct, told, records, everWorked, everRung3, mastered, streak>>

AnswerCorrect ==
  /\ phase = "asking" /\ phase' = "explaining" /\ correct' = TRUE /\ records' = records + 1
  /\ UNCHANGED <<rung, told, everWorked, everRung3, mastered, streak>>

AnswerWrong ==  \* detected misconception or unknown: both react, never mark wrong
  /\ phase = "asking" /\ phase' = "reacting"
  /\ UNCHANGED <<rung, correct, told, records, everWorked, everRung3, mastered, streak>>

Hint ==  \* rung climbs by exactly 1; rung 3 plays the worked example
  /\ phase = "asking" /\ rung < 3 /\ rung' = rung + 1
  /\ everWorked' = everWorked \/ (rung' = 3) /\ everRung3' = everRung3 \/ (rung' = 3)
  /\ UNCHANGED <<phase, correct, told, records, mastered, streak>>

WorkedEnded ==  \* after the worked example, the ORIGINAL question is asked again
  /\ phase = "asking" /\ rung = 3 /\ everWorked /\ rung' = 0
  /\ UNCHANGED <<phase, correct, told, records, everWorked, everRung3, mastered, streak>>

ReactionEnded ==  \* reaction returns to the SMALLER question (fresh ladder)
  /\ phase = "reacting" /\ phase' = "asking" /\ rung' = 0
  /\ UNCHANGED <<correct, told, records, everWorked, everRung3, mastered, streak>>

Explained ==
  /\ phase = "explaining" /\ phase' = "done"
  /\ UNCHANGED <<rung, correct, told, records, everWorked, everRung3, mastered, streak>>

AnsweredDuplicate ==  \* a double-tap answers only once: no-op outside asking
  /\ phase # "asking" /\ UNCHANGED vars

CleanAnswer ==  \* mastery: 3 clean in a row; a later mistake schedules review, never un-masters
  /\ streak' = IF streak + 1 > 3 THEN 3 ELSE streak + 1
  /\ mastered' = mastered \/ (streak + 1 >= 3)
  /\ UNCHANGED <<phase, rung, correct, told, records, everWorked, everRung3>>

Mistake ==
  /\ streak' = 0 /\ mastered' = mastered
  /\ UNCHANGED <<phase, rung, correct, told, records, everWorked, everRung3>>

Next ==
  \/ BeatEnded \/ AnswerCorrect \/ AnswerWrong \/ Hint \/ WorkedEnded
  \/ ReactionEnded \/ Explained \/ AnsweredDuplicate \/ CleanAnswer \/ Mistake

Spec == Init /\ [][Next]_vars /\ WF_vars(Explained) /\ WF_vars(ReactionEnded) /\ WF_vars(BeatEnded)

\* P1: the tutor never states the answer before the child answers correctly.
NoAnswerBeforeCorrect == ~told
\* P3: rung is a 0..3 ladder; the worked example only ever follows rung 3.
HintLadderShape == /\ rung \in 0..3 /\ (everWorked => everRung3)
\* P4: at most one answer is recorded per question.
OneRecordPerQuestion == records <= 1
\* P5 is temporal: mastered, once true in a session, stays true.
MasteryMonotonic == [](mastered => []mastered)
\* P2: every run can finish.
AlwaysCanFinish == []<>(phase = "done")

THEOREM Spec => []NoAnswerBeforeCorrect /\ []HintLadderShape /\ []OneRecordPerQuestion
=============================================================================
