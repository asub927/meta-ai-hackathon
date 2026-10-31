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

export interface ReactionScript { misconception: MisconceptionId; pip: string; smaller: Question; }

/** The follow-up ask per misconception. Placeholders only, never digits:
 *  templates carry no numbers, the solver owns every count. */
const SMALLER_ASK: Record<MisconceptionId, string> = {
  "wrong-operation": "Count what {hero} has now.",
  "echoed-a-given": "How many stayed with {hero}?",
  "smaller-from-larger": "How many are left with {hero}?",
  "direction-flip": "Did {hero} get more, or give some away?",
  "off-by-one": "Count once more, slowly. How many?",
  unknown: "Let's count together. How many?",
};

/** Code-authored smaller template per misconception. The transition re-steps
 *  it to the current question, so stored templates never go stale. */
export function smallerTemplate(miss: MisconceptionId): Question {
  return {
    id: `smaller-${miss}`, step: 0, ask: SMALLER_ASK[miss],
    interaction: miss === "direction-flip" ? "predict" : "count",
    hints: ["Point to each one as you count.", "Say each number out loud.",
      { exampleSay: "I point, I count, I say how many.", say: "Now you try." }],
    explainChoices: ["I counted", "I guessed"],
  };
}

/** The smaller question after a reaction: same step as the question that
 *  triggered it, so the target is unchanged. Reviewed stories may override
 *  the ask; the JSON boundary never accepts one from the model. */
export function smallerFor(
  reaction: { misconception: MisconceptionId; smaller?: Question }, base: Question,
): Question {
  return {
    id: `${base.id}~${reaction.misconception}`, step: base.step,
    ask: reaction.smaller?.ask ?? SMALLER_ASK[reaction.misconception],
    interaction: base.interaction, hints: base.hints, explainChoices: base.explainChoices,
  };
}
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
  | { tag: "asking"; qIndex: number; rung: 0 | 1 | 2 | 3; smaller?: Question }
  | { tag: "reacting"; qIndex: number; reaction: ReactionScript; shown: number }
  | { tag: "explaining"; qIndex: number }
  | { tag: "done" };

export type Event =
  | { type: "beat-ended" } | { type: "answered"; a: Answer }
  | { type: "hint" } | { type: "reaction-ended" } | { type: "explained"; choice: string };

export type Effect =
  | { type: "say"; line: string } | { type: "react"; shown: number }
  | { type: "record"; event: string; template?: string };

export const initial: StepPhase = { tag: "telling" };

export type Expression = "curious" | "puzzled" | "celebrate";
export interface SceneDescriptor { reducedMotion: boolean }
export interface BeatCue { atMs: number; kind: "say" | "pop" | "sparkle" }
export interface BeatScript {
  id: string; durationMs: number; expression: Expression;
  bookCount: number; startCount: number; say: string | null;
  cues: readonly BeatCue[]; reducedMotion: boolean;
}
export type ChoreoInput =
  | { kind: "beat"; question: Question }
  | { kind: "reaction"; reaction: ReactionScript; shown: number };
