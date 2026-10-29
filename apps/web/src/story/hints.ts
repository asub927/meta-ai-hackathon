import { fill, targetFor, type Question, type Solved } from "@kids-math/core";

export type HintCueKind = "question" | "highlight" | "count-along" | "ten-frame" | "worked";

export interface HintCue {
  rung: 0 | 1 | 2 | 3;
  kind: HintCueKind;
  say: string;
  tenFrame?: { full: number; partial: number };
  workedNumbers?: number[];
}

// Reducer rung mapping (see packages/core/src/step.ts): asking state starts at
// rung 0 and each hint event climbs one rung. rung 1 speaks hints[0], rung 2
// speaks hints[1], rung 3 speaks the worked example (hints[2]). So the UI cue
// for state rung r is hintCueFor(q, r, solved): rung 0 = none (null),
// 1 = question cue with hints[0], 2 = ten-frame cue with hints[1] plus the
// ten-frame rows for the count this question is about, 3 = worked example on
// its own numbers. The extra kinds ("highlight", "count-along") are kept for
// future cue variants.
export function hintCueFor(q: Question, rung: 0 | 1 | 2 | 3, solved: Solved): HintCue | null {
  if (rung === 0) return null;
  if (rung === 1) return { rung, kind: "question", say: fill(q.hints[0], solved) };
  if (rung === 2) {
    const target = targetFor(solved, q);
    return {
      rung,
      kind: "ten-frame",
      say: fill(q.hints[1], solved),
      tenFrame: { full: Math.floor(target / 10), partial: target % 10 },
    };
  }
  const worked = q.hints[2];
  return {
    rung,
    kind: "worked",
    say: `${worked.exampleSay} ${fill(worked.say, solved)}`,
    workedNumbers: (worked.exampleSay.match(/\d+/g) ?? []).map(Number),
  };
}
