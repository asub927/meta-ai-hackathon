import type { MisconceptionId, Question, Solved } from "@kids-math/core";

export type StagingKind = "conservation" | "direction" | "count-together";

export interface Staging {
  kind: StagingKind;
  bookCount: number;
  trayCount: number;
  startCount: number;
  expression: "puzzled";
}

const KIND_BY_MISCONCEPTION: Record<MisconceptionId, StagingKind> = {
  "wrong-operation": "conservation",
  "echoed-a-given": "conservation",
  "smaller-from-larger": "conservation",
  "direction-flip": "direction",
  "off-by-one": "count-together",
  unknown: "count-together",
};

/** Staging for the reaction play-out (pure, no DOM).
 *  The child's number is staged as true on the shelf (bookCount = shown)
 *  while the readout keeps the real start, so the mismatch is visible.
 *  trayCount is the size of the step the question is about. */
export function stagingFor(
  misconception: MisconceptionId,
  solved: Solved,
  q: Question,
  shown: number,
): Staging {
  const kind = KIND_BY_MISCONCEPTION[misconception];
  const startCount = solved.totals[0]!;
  // The tray stages the size of the step the question is about. A compare
  // problem has no steps and a single total, so totals indexing yields NaN;
  // its step size is the difference the question asks about.
  const trayCount = solved.problem.compare
    ? solved.problem.compare.difference
    : q.step === "final"
      ? Math.abs(solved.totals[solved.totals.length - 1]! - solved.totals[solved.totals.length - 2]!)
      : Math.abs(solved.totals[q.step + 1]! - solved.totals[q.step]!);
  return { kind, bookCount: shown, trayCount, startCount, expression: "puzzled" };
}

/** Slow-count sequence over the child's staged pile (1..shown, capped at 30).
 *  It never reveals the target; it counts what is staged. */
export function countTogetherSteps(staging: Staging, _solved: Solved, _q: Question): number[] {
  const n = Math.min(staging.bookCount, 30);
  return Array.from({ length: Math.max(n, 0) }, (_, i) => i + 1);
}
