import { CAPACITY, type ExplainerType, type WorkedExplainerStep } from "./types.js";

export interface DerivedExplainer { steps: readonly WorkedExplainerStep[]; answer: number }

const isCount = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= CAPACITY;

const bad = (why: string): Error => new Error(`explainer-bad-params: ${why}`);

/** take-away (e.g. 14 − 6 = 8): dots lift away, the pile counts down. */
function takeAway(params: Record<string, number>): DerivedExplainer {
  const { minuend: m, subtrahend: s } = params;
  if (!isCount(m) || !isCount(s) || s > m)
    throw bad(`take-away needs 0 <= subtrahend <= minuend <= ${CAPACITY}`);
  const answer = m - s;
  return {
    answer,
    steps: [
      { id: "question", text: `${m} take away ${s}. What is left?` },
      { id: "show-total", text: `Here are ${m}.` },
      { id: "remove", text: `Take away ${s}. ${s} go away.` },
      { id: "count-remainder", text: `Count what is left: ${answer}.` },
      { id: "summary", text: `${m} take away ${s} leaves ${answer}.` },
    ],
  };
}

/** make-10 (e.g. 7 + ? = 10): ten-frame fills, empty cells are counted. */
function makeTen(params: Record<string, number>): DerivedExplainer {
  const { have: h } = params;
  if (!isCount(h) || h > 10) throw bad("make-10 needs 0 <= have <= 10");
  const answer = 10 - h;
  return {
    answer,
    steps: [
      { id: "question", text: `${h} and how many more make 10?` },
      { id: "show-frame", text: `The ten-frame has ${h} filled.` },
      { id: "empty", text: "These spaces are empty." },
      { id: "count-empty", text: `Count the empty spaces: ${answer}.` },
      { id: "summary", text: `${h} and ${answer} make 10.` },
    ],
  };
}

/** compare-more (e.g. 11 and 8): matched pairs, extras are counted. */
function compareMore(params: Record<string, number>): DerivedExplainer {
  const { bigger: b, smaller: s } = params;
  if (!isCount(b) || !isCount(s) || s > b)
    throw bad(`compare-more needs 0 <= smaller <= bigger <= ${CAPACITY}`);
  const answer = b - s;
  return {
    answer,
    steps: [
      { id: "question", text: `${b} and ${s}. How many more is ${b}?` },
      { id: "line-up", text: `Line up ${b} and ${s}.` },
      { id: "extras", text: "These dots have no partner." },
      { id: "count-extras", text: `Count the extras: ${answer}.` },
      { id: "summary", text: `${b} is ${answer} more than ${s}.` },
    ],
  };
}

/** Template registry keyed by template id: one derivation per explanation
 *  type, no branching at the call sites. */
const TEMPLATES: Record<ExplainerType, (params: Record<string, number>) => DerivedExplainer> = {
  "take-away": takeAway,
  "make-10": makeTen,
  "compare-more": compareMore,
};

/** Pure derivation (docs/WORKED-EXAMPLE-EXPLAINER.md): templated steps with
 *  the problem numbers plugged in. Throws explainer-bad-params on numbers
 *  the solver could never produce. */
export function deriveExplainer(type: ExplainerType, params: Record<string, number>): DerivedExplainer {
  const derive = TEMPLATES[type];
  if (!derive) throw bad(`unknown template ${String(type)}`);
  return derive(params);
}
