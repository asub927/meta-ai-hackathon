import { solve, smallerTemplate, validateStory } from "@kids-math/core";
import type {
  Issue,
  MisconceptionId,
  Problem,
  Question,
  ReactionScript,
  StoryData,
} from "@kids-math/core";
import type { LessonFile } from "@kids-math/core";

export type { Issue, MisconceptionId, Problem, Question, ReactionScript, StoryData, LessonFile };

export type AuthorKind =
  | "take-from-result"
  | "add-to-result"
  | "take-from-start"
  | "add-to-start"
  | "compare-bigger"
  | "compare-smaller"
  | "two-step";

export interface AuthorDraft {
  lessonId: string;
  standard: string;
  hero: string;
  friend: string;
  item: string;
  kind: AuthorKind;
  start: number;
  change: number;
  secondChange: number;
  result: number;
  reference: number;
  difference: number;
  misconceptions: MisconceptionId[];
}

export const AUTHOR_STANDARDS = ["NC.2.OA.1", "NC.2.OA.2", "NC.2.OA.3", "NC.2.NBT.5"] as const;

export const AUTHOR_KINDS: { id: AuthorKind; label: string }[] = [
  { id: "take-from-result", label: "Take from (result unknown)" },
  { id: "add-to-result", label: "Add to (result unknown)" },
  { id: "take-from-start", label: "Take from (start unknown)" },
  { id: "add-to-start", label: "Add to (start unknown)" },
  { id: "compare-bigger", label: "Compare (bigger unknown)" },
  { id: "compare-smaller", label: "Compare (smaller unknown)" },
  { id: "two-step", label: "Two steps (find, then give)" },
];

export const ALL_MISCONCEPTIONS: { id: MisconceptionId; label: string }[] = [
  { id: "wrong-operation", label: "Operation mix-up" },
  { id: "echoed-a-given", label: "Echoed a given number" },
  { id: "off-by-one", label: "Off by one" },
  { id: "smaller-from-larger", label: "Smaller from larger" },
  { id: "direction-flip", label: "Direction flip" },
  { id: "unknown", label: "Unknown (needs a count-along)" },
];

const MAX_NAME = 10;
const NAME_WORD = /^[A-Za-z][A-Za-z ]{0,9}$/;
const GENDERED_NAME = /^(he|she|him|her|his|hers)$/i;

export function defaultDraft(): AuthorDraft {
  return {
    lessonId: "teacher-shells-start",
    standard: "NC.2.OA.1",
    hero: "Momo",
    friend: "Kiwi",
    item: "shells",
    kind: "take-from-start",
    start: 0,
    change: 9,
    secondChange: 4,
    result: 15,
    reference: 18,
    difference: 7,
    misconceptions: ALL_MISCONCEPTIONS.map((m) => m.id),
  };
}

function nameIssue(value: string, field: string): string | null {
  if (!NAME_WORD.test(value)) return `${field} is letters only, up to ${MAX_NAME} characters`;
  if (GENDERED_NAME.test(value.trim())) return `${field} cannot be a gendered word`;
  return null;
}

const isInt = (n: number): boolean => Number.isInteger(n) && n >= 0 && n <= 100;

/** Blocking input problems, shown live before any file is produced. */
export function draftIssues(d: AuthorDraft): string[] {
  const out: string[] = [];
  if (!/^[a-z0-9-]{1,40}$/.test(d.lessonId)) out.push("lesson id is lowercase letters, digits, and dashes");
  if (!/^NC\.\d/.test(d.standard)) out.push("standard is an NCDPI id like NC.2.OA.1");
  for (const [v, f] of [[d.hero, "hero"], [d.item, "item"]] as const) {
    const issue = nameIssue(v, f);
    if (issue) out.push(issue);
  }
  if (d.friend !== "" && nameIssue(d.friend, "friend")) out.push("friend is letters only, up to 10 characters");
  if (d.misconceptions.length === 0) out.push("pick at least one misconception");
  const need = (v: number, f: string, min = 0): void => {
    if (!isInt(v) || v < min) out.push(`${f} is a whole number from ${min} to 100`);
  };
  switch (d.kind) {
    case "take-from-result":
      need(d.start, "start", 1); need(d.change, "gave away", 1);
      if (isInt(d.start) && isInt(d.change) && d.change > d.start) out.push("gave away is more than the start");
      break;
    case "add-to-result":
      need(d.start, "start"); need(d.change, "received", 1);
      if (isInt(d.start) && isInt(d.change) && d.start + d.change > 100) out.push("start plus received is over 100");
      break;
    case "take-from-start":
      need(d.result, "ended with", 1); need(d.change, "gave away", 1);
      break;
    case "add-to-start":
      need(d.result, "ended with", 1); need(d.change, "received", 1);
      if (isInt(d.result) && isInt(d.change) && d.change >= d.result) out.push("received must be fewer than ended with");
      break;
    case "compare-bigger":
      need(d.reference, "other pile", 1); need(d.difference, "extra", 1);
      if (isInt(d.reference) && isInt(d.difference) && d.reference + d.difference > 100)
        out.push("other pile plus extra is over 100");
      break;
    case "compare-smaller":
      need(d.reference, "other pile", 1); need(d.difference, "fewer by", 1);
      if (isInt(d.reference) && isInt(d.difference) && d.difference > d.reference)
        out.push("fewer by is more than the other pile");
      break;
    case "two-step":
      need(d.start, "start", 1); need(d.change, "found", 1); need(d.secondChange, "gave away", 1);
      if (isInt(d.start) && isInt(d.change) && isInt(d.secondChange) && d.start + d.change - d.secondChange < 0)
        out.push("gave away is more than start plus found");
      if (isInt(d.start) && isInt(d.change) && isInt(d.secondChange) && d.start + d.change > 100)
        out.push("start plus found is over 100");
      break;
  }
  return out;
}

/** The teacher enters structure and givens. Totals and the answer are never
 *  entered: solve() derives every number the child sees. */
export function buildProblem(d: AuthorDraft): Problem {
  const base = { id: `${d.lessonId}-problem`, standard: d.standard, hero: d.hero, friend: d.friend || null, item: d.item };
  const who = d.friend || "a friend";
  switch (d.kind) {
    case "take-from-result":
      return { ...base, start: d.start, steps: [{ kind: "give", n: d.change, to: who }] };
    case "add-to-result":
      return { ...base, start: d.start, steps: [{ kind: "receive", n: d.change, from: who }] };
    case "take-from-start":
      return { ...base, start: 0, unknown: "start", result: d.result, steps: [{ kind: "give", n: d.change, to: who }] };
    case "add-to-start":
      return { ...base, start: 0, unknown: "start", result: d.result, steps: [{ kind: "receive", n: d.change, from: who }] };
    case "compare-bigger":
      return { ...base, start: 0, steps: [], compare: { relation: "bigger", reference: d.reference, difference: d.difference } };
    case "compare-smaller":
      return { ...base, start: 0, steps: [], compare: { relation: "smaller", reference: d.reference, difference: d.difference } };
    case "two-step":
      return {
        ...base, start: d.start,
        steps: [{ kind: "find", n: d.change, place: "bed" }, { kind: "give", n: d.secondChange, to: who }],
      };
  }
}

interface ExamplePick { say: string; nums: number[]; }

const GIVE_EXAMPLES: ExamplePick[] = [
  { say: "7 balloons, 2 pop. Fewer!", nums: [7, 2] },
  { say: "9 cubs, 3 leave. Fewer!", nums: [9, 3] },
  { say: "8 boats, 4 sail. Fewer!", nums: [8, 4] },
];
const GET_EXAMPLES: ExamplePick[] = [
  { say: "5 ducks, 3 join. More!", nums: [5, 3] },
  { say: "6 kites, 2 join. More!", nums: [6, 2] },
  { say: "4 pups, 5 join. More!", nums: [4, 5] },
];
const ADD_BACK_EXAMPLES: ExamplePick[] = [
  { say: "Ended with 10, gave 4, started 14.", nums: [10, 4, 14] },
  { say: "Ended with 12, gave 3, started 15.", nums: [12, 3, 15] },
  { say: "Ended with 9, gave 2, started 11.", nums: [9, 2, 11] },
  { say: "Ended with 16, gave 5, started 21.", nums: [16, 5, 21] },
];
const TAKE_BACK_EXAMPLES: ExamplePick[] = [
  { say: "Ended with 12, got 2, started 10.", nums: [12, 2, 10] },
  { say: "Ended with 15, got 3, started 12.", nums: [15, 3, 12] },
  { say: "Ended with 11, got 4, started 7.", nums: [11, 4, 7] },
  { say: "Ended with 20, got 6, started 14.", nums: [20, 6, 14] },
];
const COMPARE_ADD_EXAMPLES: ExamplePick[] = [
  { say: "Pile is 10, extra 3, makes 13.", nums: [10, 3, 13] },
  { say: "Pile is 12, extra 2, makes 14.", nums: [12, 2, 14] },
  { say: "Pile is 8, extra 5, makes 13.", nums: [8, 5, 13] },
];
const COMPARE_SUB_EXAMPLES: ExamplePick[] = [
  { say: "Pile is 11, short 4, makes 7.", nums: [11, 4, 7] },
  { say: "Pile is 14, short 3, makes 11.", nums: [14, 3, 11] },
  { say: "Pile is 16, short 6, makes 10.", nums: [16, 6, 10] },
];
const TWOSTEP_EXAMPLES: ExamplePick[] = [
  { say: "Had 10, found 3, lost 2, now 11.", nums: [10, 3, 2, 11] },
  { say: "Had 8, found 4, lost 3, now 9.", nums: [8, 4, 3, 9] },
  { say: "Had 12, found 2, lost 5, now 9.", nums: [12, 2, 5, 9] },
];
const SAFE_FALLBACK: ExamplePick = { say: "Point at each one and count up.", nums: [] };

function problemNumbers(solved: { problem: Problem; totals: readonly number[]; answer: number }): Set<number> {
  const p = solved.problem;
  return new Set<number>([
    ...(p.compare || p.unknown === "start" ? [] : [p.start]),
    ...p.steps.filter((s) => !(p.unknown === "change" && s.n === 0)).map((s) => s.n),
    ...solved.totals, solved.answer,
    ...(p.result !== undefined ? [p.result] : []),
    ...(p.compare ? [p.compare.reference, p.compare.difference] : []),
  ]);
}

/** A worked example from another story: first candidate sharing no number
 *  with this problem, so it can never leak the answer. */
export function pickExample(candidates: ExamplePick[], forbidden: Set<number>): string {
  return (candidates.find((c) => c.nums.every((n) => !forbidden.has(n))) ?? SAFE_FALLBACK).say;
}

type KindGroup = "give" | "get" | "compare";
const groupOf = (kind: AuthorKind): KindGroup =>
  kind === "add-to-result" || kind === "add-to-start" ? "get" : kind.startsWith("compare") ? "compare" : "give";

function pipFor(miss: MisconceptionId, group: KindGroup): string {
  switch (miss) {
    case "wrong-operation": return "If {hero} had {shown}, how come?";
    case "echoed-a-given":
      return group === "get" ? "{shown} came in. How many at first?"
        : group === "compare" ? "{shown} is that pile. Count it now."
        : "{shown} went away. How many stayed?";
    case "smaller-from-larger":
      return group === "get" ? "{shown} is short. What came in?"
        : group === "compare" ? "{shown} is off. Count this pile."
        : "{shown} is more. Count what stayed.";
    case "direction-flip": return "Did {hero} get more or give away?";
    case "off-by-one": return "So close. Count once more.";
    case "unknown": return "Count with me, nice and slow.";
  }
}

const COUNT_HINTS: [string, string] = ["Move a dot for each count.", "Say each count out loud."];
const say = (exampleSay: string): { exampleSay: string; say: string } => ({ exampleSay, say: "Now you try." });

function q(
  id: string, askStep: number | "final", ask: string, interaction: "predict" | "count",
  hintPair: [string, string], exampleSay: string, explainChoices: string[],
): Question {
  return { id, step: askStep, ask, interaction, hints: [hintPair[0], hintPair[1], say(exampleSay)], explainChoices };
}

const PREDICT_GIVE = (ex: string): { pair: [string, string]; ex: string; choices: string[] } => ({
  pair: ["When you give some away, do you keep them?", "Watch the ones that go."],
  ex, choices: ["Giving away makes fewer", "I guessed"],
});
const PREDICT_GET = (ex: string): { pair: [string, string]; ex: string; choices: string[] } => ({
  pair: ["When you get more, do you have fewer?", "Watch the ones that come in."],
  ex, choices: ["Getting more makes more", "I guessed"],
});

function questionsFor(d: AuthorDraft, forbidden: Set<number>): Question[] {
  const lid = d.lessonId;
  const give = PREDICT_GIVE(pickExample(GIVE_EXAMPLES, forbidden));
  const get = PREDICT_GET(pickExample(GET_EXAMPLES, forbidden));
  const find = { pair: ["When you find more, do you have fewer?", "Watch the ones that show up."] as [string, string], ex: pickExample(GET_EXAMPLES, forbidden), choices: ["Finding more makes more", "I guessed"] };
  switch (d.kind) {
    case "take-from-result":
      return [
        q(`${lid}-q0`, 0, "{hero} gives some away. More or fewer now?", "predict", give.pair, give.ex, give.choices),
        q(`${lid}-q1`, "final", "How many {item} now?", "count", COUNT_HINTS, SAFE_FALLBACK.say, ["I counted", "I guessed"]),
      ];
    case "add-to-result":
      return [
        q(`${lid}-q0`, 0, "{hero} gets some more. More or fewer now?", "predict", get.pair, get.ex, get.choices),
        q(`${lid}-q1`, "final", "How many {item} now?", "count", COUNT_HINTS, SAFE_FALLBACK.say, ["I counted", "I guessed"]),
      ];
    case "take-from-start":
      return [
        q(`${lid}-q0`, 0, "{hero} gives some away. More or fewer now?", "predict", give.pair, give.ex, give.choices),
        q(`${lid}-q1`, "final", "How many did {hero} start with?", "count",
          ["How many are left at the end?", "Start from the end and add back."],
          pickExample(ADD_BACK_EXAMPLES, forbidden), ["I added back", "I counted back", "I guessed"]),
      ];
    case "add-to-start":
      return [
        q(`${lid}-q0`, 0, "{hero} gets some more. More or fewer now?", "predict", get.pair, get.ex, get.choices),
        q(`${lid}-q1`, "final", "How many did {hero} start with?", "count",
          ["How many are there at the end?", "Start from the end and take back."],
          pickExample(TAKE_BACK_EXAMPLES, forbidden), ["I took back", "I counted back", "I guessed"]),
      ];
    case "compare-bigger":
      return [
        q(`${lid}-q0`, "final", "How many {item} does {hero} have?", "count",
          ["Who has the pile we compare with?", "Start there, then add the extra."],
          pickExample(COMPARE_ADD_EXAMPLES, forbidden), ["I counted on", "I guessed"]),
      ];
    case "compare-smaller":
      return [
        q(`${lid}-q0`, "final", "How many {item} does {hero} have?", "count",
          ["Who has the pile we compare with?", "Start there, then take some away."],
          pickExample(COMPARE_SUB_EXAMPLES, forbidden), ["I counted back", "I guessed"]),
      ];
    case "two-step":
      return [
        q(`${lid}-q0`, 0, "{hero} finds some more. More or fewer now?", "predict", find.pair, find.ex, find.choices),
        q(`${lid}-q1`, 1, "{hero} gives some away. More or fewer now?", "predict", give.pair, give.ex, give.choices),
        q(`${lid}-q2`, "final", "How many {item} in the end?", "count",
          ["How many after finding more?", "Count on, then take some away."],
          pickExample(TWOSTEP_EXAMPLES, forbidden), ["I counted on", "I counted back", "I guessed"]),
      ];
  }
}

/** A full validator-clean story from a teacher draft. Throws when the solver
 *  rejects the numbers, so a bad file is never produced. */
export function buildStory(d: AuthorDraft): StoryData {
  const solved = solve(buildProblem(d));
  const group = groupOf(d.kind);
  const forbidden = problemNumbers(solved);
  const reactions: ReactionScript[] = ALL_MISCONCEPTIONS
    .filter((m) => d.misconceptions.includes(m.id))
    .map((m) => ({ misconception: m.id, pip: pipFor(m.id, group), smaller: smallerTemplate(m.id) }));
  const story: StoryData = {
    solved,
    questions: questionsFor(d, forbidden),
    reactions,
    source: { url: "authoring-tool v1", licence: "CC BY-SA 4.0", changes: `Teacher-authored ${d.kind} story.` },
  };
  const issues = validateStory(story);
  if (issues.length > 0) throw new Error(`author-output-invalid: ${issues.map((i) => i.code).join(", ")}`);
  return story;
}

/** A one-story lesson file ready to save and validate. */
export function buildLesson(d: AuthorDraft): LessonFile {
  return { id: d.lessonId, standard: d.standard, stories: [buildStory(d)] };
}

export function lessonJson(d: AuthorDraft): string {
  return `${JSON.stringify(buildLesson(d), null, 2)}\n`;
}

export function validateDraftStory(d: AuthorDraft): Issue[] {
  try {
    return validateStory(buildStory(d));
  } catch (e) {
    return [{ code: "solver-error", path: "solved.problem", message: e instanceof Error ? e.message : String(e) }];
  }
}
