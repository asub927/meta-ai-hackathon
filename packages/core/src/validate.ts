import { fill, solve } from "./core.js";
import { deriveExplainer } from "./explainer.js";
import { CAPACITY, type Issue, type StoryData } from "./types.js";

const NUMBER_WORD = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/i;
const NEVER_WRONG = /\b(wrong|incorrect)\b|try again/i;
const GENDERED = /\b(he|she|him|her|his|hers|himself|herself)\b/i;
const MAX_BUBBLE = 45;

/** Rule contract (PLAN.md U4): a bad lesson cannot get past validate.
 *  Tests and callers branch on `Issue.code`, never on message text. */
export function validateStory(story: StoryData): Issue[] {
  const issues: Issue[] = [];
  const add = (code: string, path: string, message: string) => {
    if (!issues.some((i) => i.code === code && i.path === path)) issues.push({ code, path, message });
  };
  const { problem } = story.solved;

  if (!/^NC\.\d/.test(problem.standard)) add("missing-standard", "solved.problem.standard", "lesson needs an NCDPI standard id");
  if (!story.source) add("missing-source", "source", "lesson needs a source record");
  else if (/(^|[\s-])(NC|ND)([\s.-]|$)/.test(story.source.licence.toUpperCase()))
    add("forbidden-source-licence", "source.licence", "NC/ND-licensed sources cannot ship in CC BY-SA content");

  // Every derived number is recomputed; authored totals are never trusted.
  try {
    const derived = solve(problem);
    if (JSON.stringify(derived.totals) !== JSON.stringify(story.solved.totals))
      add("totals-mismatch", "solved.totals", "totals do not match the solver");
    if (derived.answer !== story.solved.answer)
      add("answer-mismatch", "solved.answer", "answer does not match the solver");
  } catch (e) {
    const code = e instanceof Error && /^[a-z][a-z-]+/.test(e.message) ? e.message.split(":")[0]! : "solver-error";
    add(code, "solved.problem", e instanceof Error ? e.message : String(e));
  }
  for (const [i, t] of story.solved.totals.entries()) {
    if (t > CAPACITY) add("count-above-capacity", `solved.totals.${i}`, "count above capacity");
    if (t < 0) add("negative-count", `solved.totals.${i}`, "count below zero");
  }

  const checkLine = (template: string, path: string, extra: Record<string, number | string> = {}) => {
    if (/\d/.test(template)) add("digit-in-template", path, "templates carry placeholders, never typed digits");
    if (NUMBER_WORD.test(template)) add("number-word-in-template", path, "templates carry placeholders, never number words");
    if (NEVER_WRONG.test(template)) add("never-wrong", path, "a wrong answer is never marked wrong");
    if (GENDERED.test(template)) add("gendered-word", path, "line uses a gendered word outside the cast");
    try {
      if (fill(template, story.solved, extra).length > MAX_BUBBLE) add("bubble-too-long", path, "bubble over 45 characters after filling");
    } catch { add("unknown-placeholder", path, "placeholder is not derived by the solver"); }
  };

  story.questions.forEach((q, qi) => {
    checkLine(q.ask, `questions.${qi}.ask`);
    checkLine(q.hints[0], `questions.${qi}.hints.0`);
    checkLine(q.hints[1], `questions.${qi}.hints.1`);
    // Rung 3 is a same-question derivation (PR4): steps are literal text with
    // real numbers, so template rules never apply. The derivation is the
    // oracle: every step needs its VoiceOver text, and the final step must
    // state the derived answer. A derivation the solver could never produce
    // (bad params, out-of-range answer) fails as a mismatch too.
    const explainer = q.hints[2];
    let answer: number | null = null;
    try {
      answer = deriveExplainer(explainer.type, explainer.params).answer;
    } catch { answer = null; }
    explainer.steps.forEach((st, si) => {
      if (st.text.trim() === "") add("explainer-empty-step", `questions.${qi}.hints.2.steps.${si}`, "every explainer step needs its text alternative");
    });
    const finalText = explainer.steps.length > 0 ? explainer.steps[explainer.steps.length - 1]!.text : "";
    const finalNumbers = (finalText.match(/-?\d+/g) ?? []).map(Number);
    if (answer === null || answer < 0 || answer > CAPACITY || !finalNumbers.includes(answer))
      add("explainer-answer-mismatch", `questions.${qi}.hints.2`, "final explainer step must state the derived answer");
    q.explainChoices.forEach((c, ci) => checkLine(c, `questions.${qi}.explainChoices.${ci}`));
  });
  story.reactions.forEach((r, ri) => checkLine(r.pip, `reactions.${ri}.pip`, { shown: story.solved.answer }));
  return issues;
}
