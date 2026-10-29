import { fill } from "./core.js";
import type {
  BeatScript,
  ChoreoInput,
  Question,
  ReactionScript,
  SceneDescriptor,
  Solved,
} from "./types.js";

/** Minimal BeatScript contract for U5; spring sampling/evaluator deferred to U6. */
export function choreograph(scene: SceneDescriptor, solved: Solved, input: ChoreoInput): BeatScript {
  if (input.kind === "beat") {
    const question: Question = input.question;
    const bookCount =
      question.step === "final"
        ? solved.totals[solved.totals.length - 2]!
        : solved.totals[question.step as number]!;
    return {
      id: `beat:${question.id}`,
      durationMs: scene.reducedMotion ? 0 : 1200,
      expression: "curious",
      bookCount,
      startCount: solved.totals[0]!,
      say: fill(question.ask, solved),
      cues: [{ atMs: 0, kind: "say" }],
      reducedMotion: scene.reducedMotion,
    };
  }
  const reaction: ReactionScript = input.reaction;
  return {
    id: `reaction:${reaction.misconception}`,
    durationMs: scene.reducedMotion ? 0 : 1800,
    expression: "puzzled",
    bookCount: input.shown,
    startCount: solved.totals[0]!,
    say: fill(reaction.pip, solved, { shown: input.shown }),
    cues: [
      { atMs: 0, kind: "say" },
      { atMs: 300, kind: "pop" },
    ],
    reducedMotion: scene.reducedMotion,
  };
}
