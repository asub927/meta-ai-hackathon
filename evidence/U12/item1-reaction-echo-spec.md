# Item 1 spec: echo the child's answer in every reaction

Goal restated. The child should feel the reaction follows from their answer.
Today three reaction templates never mention what the child said, and predict
reactions stage the target instead of the child's direction.

## Problem

Finding 1 in kid-flow-findings.md. Frames 2 and 5 show direction-flip
reactions ("Did Kiwi get more, or give some away?") with no reference to the
child's wrong direction. Off-by-one and unknown templates are equally generic.
For predict questions step() sets shown to targetFor, so even templates with
{shown} display the target, never the child's word.

## Data shape

Add one field. The reacting phase carries said, the child's answer as display
text. Direction word for predict, numeral string for count.

```ts
{ tag: "reacting"; qIndex: number; reaction: ReactionScript; shown: number; said: string }
```

fill() gains {said} alongside {shown}. No other shape changes.

## Changes

1. packages/core/src/types.ts. Add said to the reacting phase.
2. packages/core/src/step.ts answered branch. Compute said from ev.a.
   Include it in the phase. It flows into the say effect through fill.
3. packages/core/src/core.ts fill(). Support {said} from extras.
4. lessons/nc-2-oa-1-lesson-1.json. Update direction-flip, off-by-one, and
   unknown templates in all five stories to echo {said}. Keep every other
   word identical. Example target text: "You said {said}. Did {hero} get
   more, or give some away?" Keep predict {shown} templates unchanged.
5. No timeline.mjs change. It reads tag and qIndex only.

## Tests

- Core unit tests. Predict wrong answer yields said equal to the direction
  and a say line containing it. Count wrong answer yields said equal to the
  numeral string. Correct answers are unaffected.
- Template coverage test. Every story times every misconception template
  renders non-empty with sample said and shown values.
- Conformance vectors. Regenerate and verify green. The phase shape change
  may alter recorded vectors.
- Timeline tests. node --test render/ stays green.
- Playwright wrong-path drive. Use the existing reactions-play-out verify
  feature. Screenshot the reaction beat showing the echo.

## Non-goals

Re-ask marker is item 2. Input clearing is item 3. No animation, mascot, or
voice changes. No choreograph duration or cue changes.

## Risks

- Vectors may byte-compare phases. Regen is part of the task, not optional.
- Lesson JSON edits are hand edits across five stories. Keep diffs minimal.
- predict shown stays the target for staging. This spec echoes in words
  only and does not restage numbers.
