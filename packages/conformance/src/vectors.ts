import { choreograph, detect, fill, step, stickerStory, targetFor } from "@kids-math/core";
import type {
  Answer,
  Event,
  MisconceptionId,
  Question,
  StepPhase,
} from "@kids-math/core";

export interface VectorCase {
  id: string;
  input: unknown;
  expected: unknown;
}

export interface VectorFile {
  version: 1;
  kind: string;
  cases: VectorCase[];
}

const STORY = "stickers" as const;
const solved = stickerStory.solved;
const questions: readonly Question[] = stickerStory.questions;

function questionAt(qIndex: number): Question {
  const q = questions[qIndex];
  if (!q) throw new Error(`no question at index ${qIndex}`);
  return q;
}

/** The right answer for a question, derived from core (never hand-written). */
function correctAnswer(q: Question): Answer {
  if (q.interaction === "predict") {
    for (const value of ["more", "fewer", "same"] as const) {
      const a: Answer = { kind: "predict", value };
      if (detect(solved, q, a) === null) return a;
    }
    throw new Error(`no correct predict answer for ${q.id}`);
  }
  return { kind: "count", value: targetFor(solved, q) };
}

function reactionFor(miss: MisconceptionId) {
  const r = stickerStory.reactions.find((x) => x.misconception === miss)
    ?? stickerStory.reactions.find((x) => x.misconception === "unknown")!;
  return r;
}

// --- step ---

function stepCase(id: string, state: StepPhase, event: Event): VectorCase {
  const [next, effects] = step(state, event, stickerStory);
  return { id, input: { story: STORY, state, event }, expected: { state: next, effects } };
}

const count = (value: number): Answer => ({ kind: "count", value });
const predict = (value: "more" | "fewer" | "same"): Answer => ({ kind: "predict", value });
const answered = (a: Answer): Event => ({ type: "answered", a });

export function buildStepVectors(): VectorFile {
  const cases: VectorCase[] = [];
  const q0 = questionAt(0);
  const q1 = questionAt(1);
  const q2 = questionAt(2);
  const a0 = correctAnswer(q0);
  const a1 = correctAnswer(q1);
  const a2 = correctAnswer(q2);

  // telling -> asking, plus ignored events in telling
  cases.push(stepCase("telling-beat-ended", { tag: "telling" }, { type: "beat-ended" }));
  cases.push(stepCase("telling-hint-ignored", { tag: "telling" }, { type: "hint" }));

  // full right-answer chain to done
  cases.push(stepCase("ask-q0-correct", { tag: "asking", qIndex: 0, rung: 0 }, answered(a0)));
  const explainChoice = (q: Question): Event => ({ type: "explained", choice: q.explainChoices[0]! });
  cases.push(stepCase("explain-q0-next", { tag: "explaining", qIndex: 0 }, explainChoice(q0)));
  cases.push(stepCase("ask-q1-correct", { tag: "asking", qIndex: 1, rung: 0 }, answered(a1)));
  cases.push(stepCase("explain-q1-next", { tag: "explaining", qIndex: 1 }, explainChoice(q1)));
  cases.push(stepCase("ask-q2-correct", { tag: "asking", qIndex: 2, rung: 0 }, answered(a2)));
  cases.push(stepCase("explain-q2-done", { tag: "explaining", qIndex: 2 }, explainChoice(q2)));

  // each misconception reacting (wrong answers derived from the story, expected via core)
  cases.push(stepCase("ask-q0-direction-flip", { tag: "asking", qIndex: 0, rung: 0 }, answered(predict("more"))));
  for (const v of [33, 9, 16, 25, 0])
    cases.push(stepCase(`ask-q1-wrong-${v}`, { tag: "asking", qIndex: 1, rung: 0 }, answered(count(v))));
  for (const v of [10, 5, 19, 21, 0])
    cases.push(stepCase(`ask-q2-wrong-${v}`, { tag: "asking", qIndex: 2, rung: 0 }, answered(count(v))));

  // hint ladder rung 0 -> 1 -> 2 -> 3 -> re-ask
  for (const rung of [0, 1, 2, 3] as const) {
    const id = rung === 3 ? "hint-q1-rung3-reask" : `hint-q1-rung${rung}`;
    cases.push(stepCase(id, { tag: "asking", qIndex: 1, rung }, { type: "hint" }));
  }

  // double-tap: answered in explaining is ignored
  cases.push(stepCase("explaining-double-tap-ignored", { tag: "explaining", qIndex: 1 }, answered(a1)));

  // reaction-ended -> asking (reacting state produced by the reducer itself)
  {
    const [reacting] = step({ tag: "asking", qIndex: 1, rung: 0 }, answered(count(33)), stickerStory);
    if (reacting.tag !== "reacting") throw new Error("expected reacting state");
    cases.push(stepCase("reaction-ended-to-asking", reacting, { type: "reaction-ended" }));
  }

  // unknown fallback: an answer matching no registered misconception
  cases.push(stepCase("ask-q1-unknown", { tag: "asking", qIndex: 1, rung: 0 }, answered(count(0))));

  return { version: 1, kind: "step", cases };
}

// --- detect ---

export function buildDetectVectors(): VectorFile {
  const cases: VectorCase[] = [];
  for (const qIndex of [1, 2]) {
    const q = questionAt(qIndex);
    for (let value = 0; value <= 100; value++) {
      const answer: Answer = { kind: "count", value };
      cases.push({
        id: `detect-q${qIndex}-count-${value}`,
        input: { story: STORY, qIndex, answer },
        expected: detect(solved, q, answer),
      });
    }
  }
  {
    const q = questionAt(0);
    for (const value of ["more", "fewer", "same"] as const) {
      const answer: Answer = { kind: "predict", value };
      cases.push({
        id: `detect-q0-predict-${value}`,
        input: { story: STORY, qIndex: 0, answer },
        expected: detect(solved, q, answer),
      });
    }
  }
  return { version: 1, kind: "detect", cases };
}

// --- fill ---

function fillCase(id: string, template: string, extra?: Record<string, number | string>): VectorCase {
  return {
    id,
    input: extra === undefined ? { story: STORY, template } : { story: STORY, template, extra },
    expected: fill(template, solved, extra ?? {}),
  };
}

export function buildFillVectors(): VectorFile {
  const cases: VectorCase[] = [];
  questions.forEach((q, qi) => {
    cases.push(fillCase(`fill-q${qi}-ask`, q.ask));
    cases.push(fillCase(`fill-q${qi}-hint0`, q.hints[0]));
    cases.push(fillCase(`fill-q${qi}-hint1`, q.hints[1]));
    // No hint2 fill cases: rung 3 is a same-question derivation (WorkedExplainer),
    // not a fillable line template. Its steps are covered by explainer.test.ts.
  });
  for (const r of stickerStory.reactions)
    cases.push(fillCase(`fill-reaction-${r.misconception}`, r.pip, { shown: 33 }));
  return { version: 1, kind: "fill", cases };
}

// --- choreograph ---

export function buildChoreographVectors(): VectorFile {
  const cases: VectorCase[] = [];
  for (let qIndex = 0; qIndex < questions.length; qIndex++) {
    const question = questionAt(qIndex);
    for (const reducedMotion of [false, true]) {
      cases.push({
        id: `choreograph-beat-q${qIndex}-${reducedMotion ? "reduced" : "full"}`,
        input: { story: STORY, scene: { reducedMotion }, beat: { kind: "beat", qIndex } },
        expected: choreograph({ reducedMotion }, solved, { kind: "beat", question }),
      });
    }
  }
  for (const r of stickerStory.reactions) {
    const reaction = reactionFor(r.misconception);
    for (const reducedMotion of [false, true]) {
      cases.push({
        id: `choreograph-reaction-${r.misconception}-${reducedMotion ? "reduced" : "full"}`,
        input: {
          story: STORY,
          scene: { reducedMotion },
          beat: { kind: "reaction", misconception: r.misconception, shown: 33 },
        },
        expected: choreograph({ reducedMotion }, solved, { kind: "reaction", reaction, shown: 33 }),
      });
    }
  }
  return { version: 1, kind: "choreograph", cases };
}

export const builders: Record<string, () => VectorFile> = {
  step: buildStepVectors,
  detect: buildDetectVectors,
  fill: buildFillVectors,
  choreograph: buildChoreographVectors,
};
