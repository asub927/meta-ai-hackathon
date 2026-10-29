// Domain model transcribed from PLAN.md §2 (Socratic math story plan).
export type Brand<T, B> = T & { readonly __brand: B };
export type Count = Brand<number, "Count">;

export type Step =
  | { kind: "give"; n: number; to: string }
  | { kind: "pop"; n: number }
  | { kind: "find"; n: number; place: "bed" | "gift" }
  | { kind: "receive"; n: number; from: string };

export interface Problem {
  id: string; standard: string; hero: string; friend: string | null; item: string;
  start: number; steps: readonly Step[];
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
export interface StoryData { solved: Solved; questions: readonly Question[]; reactions: readonly ReactionScript[] }

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
