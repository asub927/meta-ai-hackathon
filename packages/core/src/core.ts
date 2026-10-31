import { CAPACITY, type Answer, type MisconceptionId, type Problem, type Question, type Solved, type Step } from "./types.js";

const checkCount = (n: number): number => {
  if (n < 0) throw new Error(`negative-count: ${n}`);
  if (n > CAPACITY) throw new Error(`count-above-capacity: ${n} > ${CAPACITY}`);
  return n;
};

/** Every number a child sees is derived here, never authored (PLAN.md §2).
 *  `answer` is always the value the child must find: the final total for
 *  result-unknown, the missing start/change for those unknown positions,
 *  and reference ± difference (or |heroCount − reference|) for compare. */
export function solve(problem: Problem): Solved {
  if (problem.compare) {
    if (problem.steps.length) throw new Error("compare-with-steps: compare problems have no steps");
    const { relation, reference, difference, heroCount } = problem.compare;
    checkCount(reference); checkCount(difference);
    if (relation === "difference") {
      if (heroCount === undefined) throw new Error("missing-hero-count: difference compare needs heroCount");
      checkCount(heroCount);
      const answer = checkCount(Math.abs(heroCount - reference));
      return { problem, totals: [answer], answer };
    }
    const answer = checkCount(relation === "bigger" ? reference + difference : reference - difference);
    return { problem, totals: [answer], answer };
  }
  const unknown = problem.unknown ?? "result";
  if (unknown !== "result" && problem.result === undefined)
    throw new Error(`missing-result: unknown="${unknown}" needs the known final total`);
  if (unknown === "change" && problem.steps.length !== 1)
    throw new Error("change-unknown-needs-one-step");
  if (problem.result !== undefined) checkCount(problem.result);
  for (const s of problem.steps) checkCount(s.n);

  if (unknown === "start") {
    // Work backwards from the known result, undoing each step.
    let start = problem.result!;
    for (let i = problem.steps.length - 1; i >= 0; i--) start -= delta(problem.steps[i]!);
    checkCount(start);
    const totals = [start];
    for (const s of problem.steps) totals.push(checkCount(totals[totals.length - 1]! + delta(s)));
    return { problem, totals, answer: start };
  }
  checkCount(problem.start);
  if (unknown === "change") {
    const step = problem.steps[0]!;
    const isAdd = step.kind === "find" || step.kind === "receive";
    const change = checkCount(isAdd ? problem.result! - problem.start : problem.start - problem.result!);
    const totals = [problem.start, checkCount(problem.start + (isAdd ? change : -change))];
    return { problem, totals, answer: change };
  }
  const totals: number[] = [problem.start];
  for (const s of problem.steps) totals.push(checkCount(totals[totals.length - 1]! + delta(s)));
  return { problem, totals, answer: totals[totals.length - 1]! };
}
function delta(s: Step): number {
  return s.kind === "give" || s.kind === "pop" ? -s.n : s.n;
}
/** Step size with the change-unknown placeholder (n = 0) replaced by the derived change. */
function stepDelta(solved: Solved, idx: number): number {
  const s = solved.problem.steps[idx]!;
  const n = solved.problem.unknown === "change" ? solved.answer : s.n;
  return s.kind === "give" || s.kind === "pop" ? -n : n;
}

/** The total a question is really asking about: after its step, or the final answer. */
export function targetFor(solved: Solved, q: Question): number {
  return q.step === "final" ? solved.answer : solved.totals[(q.step as number) + 1]!;
}

export function isCorrect(solved: Solved, q: Question, a: Answer): boolean {
  if (q.interaction === "predict" && a.kind === "predict") {
    const idx = q.step === "final" ? solved.problem.steps.length - 1 : q.step;
    const step = solved.problem.steps[idx];
    if (!step) return false;
    const d = stepDelta(solved, idx);
    const want = d > 0 ? "more" : d < 0 ? "fewer" : "same";
    return a.value === want;
  }
  if (q.interaction === "count" && a.kind === "count") return a.value === targetFor(solved, q);
  return false;
}

/** Misconception registry (code, not content). Returns null when correct. */
export function detect(solved: Solved, q: Question, a: Answer): MisconceptionId | null {
  if (isCorrect(solved, q, a)) return null;
  if (a.kind === "predict") return "direction-flip";
  const target = targetFor(solved, q);
  if (!solved.problem.steps.length) { // compare problem: no step to echo or flip
    if (Math.abs(a.value - target) === 1) return "off-by-one";
    if (solved.problem.compare && (a.value === solved.problem.compare.reference || a.value === solved.problem.compare.difference)) return "echoed-a-given";
    return "unknown";
  }
  const stepIdx = q.step === "final" ? solved.problem.steps.length - 1 : q.step;
  const d = stepDelta(solved, stepIdx);
  const stepN = Math.abs(d);
  const before = solved.totals[stepIdx]!;
  if (Math.abs(a.value - target) === 1) return "off-by-one";
  if (a.value === stepN) return "echoed-a-given";
  if (a.value === before - d) return "wrong-operation"; // did the opposite operation
  if (a.value > before && d < 0) return "smaller-from-larger";
  return "unknown";
}

/** Pip's lines: templates carry placeholders only; numbers come from Solved. */
export function fill(template: string, solved: Solved, extra: Record<string, number | string> = {}): string {
  const vars: Record<string, string> = {
    hero: solved.problem.hero, item: solved.problem.item,
    // `{start}` is the derived start (for start-unknown that is the answer, not the 0 placeholder).
    start: String(solved.totals[0] ?? solved.problem.start), answer: String(solved.answer),
    result: String(solved.problem.result ?? solved.answer), missing: String(solved.answer),
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])),
  };
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    if (!(k in vars)) throw new Error(`unknown placeholder {${k}}`);
    return vars[k]!;
  });
}

/** Validator fragment (PLAN.md U4): a template must never contain a typed digit. */
export function templateIssues(template: string): string[] {
  return /\d/.test(template) ? ["digit-in-template"] : [];
}

export interface LogEvent { type: string; clean?: boolean; template?: string; data?: Record<string, string | number> }

/** Mastery (PLAN.md): 3 clean in a row, >=2 distinct templates; never drops in a session. */
export function mastery(log: readonly LogEvent[]): boolean {
  const templateOf = (e: LogEvent): string =>
    e.template ?? (typeof e.data?.template === "string" ? e.data.template : e.type);
  let streak: string[] = [], mastered = false;
  for (const e of log) {
    if (e.type !== "answered" && e.type !== "answered-clean") continue;
    if (e.clean ?? e.type === "answered-clean") { streak.push(templateOf(e)); if (streak.length >= 3 && new Set(streak.slice(-3)).size >= 2) mastered = true; }
    else streak = []; // a mistake schedules review; `mastered` itself never resets
  }
  return mastered;
}
