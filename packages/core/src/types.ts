// Domain model transcribed from PLAN.md §2 (Socratic math story plan).
export type Brand<T, B> = T & { readonly __brand: B };
export type Count = Brand<number, "Count">;

export type Step =
  | { kind: "give"; n: number; to: string }
  | { kind: "pop"; n: number }
  | { kind: "find"; n: number; place: "bed" | "gift" }
  | { kind: "receive"; n: number; from: string };

export const CAPACITY = 100;

export type UnknownPosition = "start" | "change" | "result";
export type CompareRelation = "bigger" | "smaller" | "difference";
export interface CompareShape { relation: CompareRelation; reference: number; difference: number; heroCount?: number }

export interface Problem {
  id: string; standard: string; hero: string; friend: string | null; item: string;
  start: number; steps: readonly Step[];
  /** NC.2.OA.1 extensions (U4). Default "result". For "start", `start` is a 0 placeholder and
   *  the solver derives it from `result`; for "change", exactly one step carries a 0 `n`
   *  placeholder and the solver derives its size from `result`. */
  unknown?: UnknownPosition;
  /** Known final total, required when `unknown` is "start" or "change". */
  result?: number;
  /** Compare problem (no steps): answer derives from reference ± difference, or |heroCount − reference| for "difference". */
  compare?: CompareShape;
}
export interface Solved { problem: Problem; totals: readonly number[]; answer: number }

export type Answer =
  | { kind: "predict"; value: "more" | "fewer" | "same" }
  | { kind: "count"; value: number };

export type MisconceptionId = "wrong-operation" | "echoed-a-given" | "off-by-one"
  | "smaller-from-larger" | "direction-flip" | "unknown";

export interface Question {
  id: string; step: number | "final"; ask: string;
  interaction: "predict" | "count";
  hints: readonly [string, string, { exampleSay: string; say: string }];
  explainChoices: readonly string[];
}

export interface ReactionScript { misconception: MisconceptionId; pip: string; }
export interface LessonSource { url: string; licence: string; changes: string }
export interface StoryData {
  solved: Solved; questions: readonly Question[]; reactions: readonly ReactionScript[];
  /** Content provenance (U4): every lesson carries where it came from. */
  source?: LessonSource;
}

/** A validation finding. Callers branch on `code`, never on `message` (PLAN.md U4). */
export interface Issue { code: string; path: string; message: string }

export type StepPhase =
  | { tag: "telling" }
  | { tag: "asking"; qIndex: number; rung: 0 | 1 | 2 | 3 }
  | { tag: "reacting"; qIndex: number; reaction: ReactionScript; shown: number }
  | { tag: "explaining"; qIndex: number }
  | { tag: "done" };

export type Event =
  | { type: "beat-ended" } | { type: "answered"; a: Answer }
  | { type: "hint" } | { type: "reaction-ended" } | { type: "explained"; choice: string };

export type Effect =
  | { type: "say"; line: string } | { type: "react"; shown: number }
  | { type: "record"; event: string };

export const initial: StepPhase = { tag: "telling" };
