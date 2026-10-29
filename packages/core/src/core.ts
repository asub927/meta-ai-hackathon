import type { Answer, MisconceptionId, Problem, Question, Solved, Step } from "./types.js";

/** Every number a child sees is derived here, never authored (PLAN.md §2). */
export function solve(problem: Problem): Solved {
  const totals: number[] = [problem.start];
  for (const s of problem.steps) totals.push(totals[totals.length - 1]! + delta(s));
  return { problem, totals, answer: totals[totals.length - 1]! };
}
function delta(s: Step): number {
  return s.kind === "give" || s.kind === "pop" ? -s.n : s.n;
}

/** The total a question is really asking about: after its step, or the final answer. */
export function targetFor(solved: Solved, q: Question): number {
  return q.step === "final" ? solved.answer : solved.totals[(q.step as number) + 1]!;
}

export function isCorrect(solved: Solved, q: Question, a: Answer): boolean {
  if (q.interaction === "predict" && a.kind === "predict") {
    const step = solved.problem.steps[q.step === "final" ? solved.problem.steps.length - 1 : q.step]!;
    const want = delta(step) > 0 ? "more" : delta(step) < 0 ? "fewer" : "same";
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
  const stepIdx = q.step === "final" ? solved.problem.steps.length - 1 : q.step;
  const step = solved.problem.steps[stepIdx]!;
  const before = solved.totals[stepIdx]!;
  if (Math.abs(a.value - target) === 1) return "off-by-one";
  if (a.value === step.n) return "echoed-a-given";
  if (a.value === before - delta(step)) return "wrong-operation"; // did the opposite operation
  if (a.value > before && delta(step) < 0) return "smaller-from-larger";
  return "unknown";
}

/** Pip's lines: templates carry placeholders only; numbers come from Solved. */
export function fill(template: string, solved: Solved, extra: Record<string, number | string> = {}): string {
  const vars: Record<string, string> = {
    hero: solved.problem.hero, item: solved.problem.item,
    start: String(solved.problem.start), answer: String(solved.answer),
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

export interface LogEvent { type: string; clean?: boolean; template?: string }

/** Mastery (PLAN.md): 3 clean in a row, >=2 distinct templates; never drops in a session. */
export function mastery(log: readonly LogEvent[]): boolean {
  let streak: string[] = [], mastered = false;
  for (const e of log) {
    if (e.type !== "answered") continue;
    if (e.clean) { streak.push(e.template ?? "?"); if (streak.length >= 3 && new Set(streak.slice(-3)).size >= 2) mastered = true; }
    else streak = []; // a mistake schedules review; `mastered` itself never resets
  }
  return mastered;
}
