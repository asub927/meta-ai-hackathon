import { solve } from "./core.js";
import { parseStoryData } from "./schema.js";
import { validateStory } from "./validate.js";
import type { Issue, ReactionScript, StoryData } from "./types.js";

export interface LessonFile { id: string; standard: string; stories: StoryData[] }

export type LoadLessonResult = { ok: true; lesson: LessonFile } | { ok: false; issues: Issue[] };

/** Boundary loader for a committed lesson file: top shape here, each story
 *  through parseStoryData then validateStory, issues carry the story index. */
export function loadLesson(json: unknown): LoadLessonResult {
  if (typeof json !== "object" || json === null || Array.isArray(json))
    return { ok: false, issues: [{ code: "invalid-shape", path: "", message: "lesson must be an object" }] };
  const rec = json as Record<string, unknown>;
  const top: Issue[] = [];
  if (typeof rec.id !== "string") top.push({ code: "invalid-shape", path: "id", message: "lesson needs a string id" });
  if (typeof rec.standard !== "string")
    top.push({ code: "invalid-shape", path: "standard", message: "lesson needs a standard id" });
  if (!Array.isArray(rec.stories))
    top.push({ code: "invalid-shape", path: "stories", message: "lesson needs a stories array" });
  if (top.length > 0) return { ok: false, issues: top };
  const issues: Issue[] = [];
  const stories: StoryData[] = [];
  for (let i = 0; i < (rec.stories as unknown[]).length; i++) {
    const parsed = parseStoryData((rec.stories as unknown[])[i]);
    if (!parsed.ok) {
      for (const issue of parsed.issues)
        issues.push({ ...issue, path: `stories.${i}${issue.path ? `.${issue.path}` : ""}` });
      continue;
    }
    for (const issue of validateStory(parsed.data))
      issues.push({ ...issue, path: `stories.${i}.${issue.path}` });
    stories.push(parsed.data);
  }
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, lesson: { id: rec.id as string, standard: rec.standard as string, stories } };
}

const SOURCE = { url: "PLAN.md U12", licence: "CC BY-SA 4.0", changes: "Original story written for this app." };
const STANDARD = "NC.2.OA.1";

const OFF_BY_ONE: ReactionScript = { misconception: "off-by-one", pip: "So close. Let's count together." };
const UNKNOWN: ReactionScript = { misconception: "unknown", pip: "Let's count together, slowly." };
const WRONG_OP: ReactionScript = {
  misconception: "wrong-operation", pip: "If {hero} had {shown}, where did they come from?",
};
const DIRECTION_FLIP: ReactionScript = {
  misconception: "direction-flip", pip: "Did {hero} get more, or give some away?",
};

/** Lesson 1 (PLAN.md U12): five reviewed NC.2.OA.1 stories. Every total is
 *  derived by solve() — answers are never hand-written. */
export function buildLesson1(): LessonFile {
  const s1: StoryData = {
    solved: solve({
      id: "momo-shells-start-unknown", standard: STANDARD, hero: "Momo", friend: "Kiwi",
      item: "shell", start: 0, unknown: "start", result: 15,
      steps: [{ kind: "give", n: 9, to: "Kiwi" }],
    }),
    questions: [
      {
        id: "s1-q0-predict", step: 0, ask: "{hero} gives some away. More or fewer now?", interaction: "predict",
        hints: ["When you give some away, do you keep them?", "Watch the ones that go.",
          { exampleSay: "7 balloons, 2 pop. Fewer!", say: "Now you try." }],
        explainChoices: ["Giving away makes fewer", "I guessed"],
      },
      {
        id: "s1-q1-count", step: "final", ask: "How many did {hero} start with?", interaction: "count",
        hints: ["How many are left at the end?", "Start from the end and add back.",
          { exampleSay: "Ended with 10, gave 4, started 14.", say: "Now you try." }],
        explainChoices: ["I added back", "I counted back", "I guessed"],
      },
    ],
    reactions: [
      WRONG_OP,
      { misconception: "echoed-a-given", pip: "{shown} is how many went away. How many stayed?" },
      { misconception: "smaller-from-larger", pip: "{shown} is more than the start. Did any go away?" },
      DIRECTION_FLIP, OFF_BY_ONE, UNKNOWN,
    ],
    source: { ...SOURCE },
  };

  const s2: StoryData = {
    solved: solve({
      id: "kiwi-marbles-start-unknown", standard: STANDARD, hero: "Kiwi", friend: "Momo",
      item: "marble", start: 0, unknown: "start", result: 31,
      steps: [{ kind: "receive", n: 6, from: "Momo" }],
    }),
    questions: [
      {
        id: "s2-q0-predict", step: 0, ask: "{hero} gets some more. More or fewer now?", interaction: "predict",
        hints: ["When you get more, do you have fewer?", "Watch the ones that come in.",
          { exampleSay: "5 ducks, 3 join. More!", say: "Now you try." }],
        explainChoices: ["Getting more makes more", "I guessed"],
      },
      {
        id: "s2-q1-count", step: "final", ask: "How many did {hero} start with?", interaction: "count",
        hints: ["How many are there at the end?", "Start from the end and take back.",
          { exampleSay: "Ended with 12, got 2, started 10.", say: "Now you try." }],
        explainChoices: ["I took back", "I counted back", "I guessed"],
      },
    ],
    reactions: [
      WRONG_OP,
      { misconception: "echoed-a-given", pip: "{shown} came in. How many were there first?" },
      { misconception: "smaller-from-larger", pip: "{shown} is less. What else came in?" },
      DIRECTION_FLIP, OFF_BY_ONE, UNKNOWN,
    ],
    source: { ...SOURCE },
  };

  const s3: StoryData = {
    solved: solve({
      id: "momo-books-bigger-18-7", standard: STANDARD, hero: "Momo", friend: "Kiwi",
      item: "book", start: 0, steps: [],
      compare: { relation: "bigger", reference: 18, difference: 7 },
    }),
    questions: [
      {
        id: "s3-q0-count", step: "final", ask: "How many books does {hero} have?", interaction: "count",
        hints: ["Who has the pile we compare with?", "Start there, then add the extra.",
          { exampleSay: "Pile is 10, extra 3, makes 13.", say: "Now you try." }],
        explainChoices: ["I counted on", "I guessed"],
      },
    ],
    reactions: [
      WRONG_OP,
      { misconception: "echoed-a-given", pip: "{shown} is the other pile. Add the extra." },
      { misconception: "smaller-from-larger", pip: "{shown} is less. Did {hero} add the extra?" },
      { misconception: "direction-flip", pip: "Who has more, {hero} or the other pile?" },
      OFF_BY_ONE, UNKNOWN,
    ],
    source: { ...SOURCE },
  };

  const s4: StoryData = {
    solved: solve({
      id: "kiwi-crayons-smaller-32-8", standard: STANDARD, hero: "Kiwi", friend: "Momo",
      item: "crayon", start: 0, steps: [],
      compare: { relation: "smaller", reference: 32, difference: 8 },
    }),
    questions: [
      {
        id: "s4-q0-count", step: "final", ask: "How many crayons does {hero} have?", interaction: "count",
        hints: ["Who has the pile we compare with?", "Start there, then take some away.",
          { exampleSay: "Pile is 11, short 4, makes 7.", say: "Now you try." }],
        explainChoices: ["I counted back", "I guessed"],
      },
    ],
    reactions: [
      WRONG_OP,
      { misconception: "echoed-a-given", pip: "{shown} is the other pile. Take some away." },
      { misconception: "smaller-from-larger", pip: "{shown} is more. Did {hero} take some away?" },
      { misconception: "direction-flip", pip: "Who has fewer, {hero} or the other pile?" },
      OFF_BY_ONE, UNKNOWN,
    ],
    source: { ...SOURCE },
  };

  const s5: StoryData = {
    solved: solve({
      id: "momo-beads-7-5-4", standard: STANDARD, hero: "Momo", friend: "Kiwi",
      item: "bead", start: 7,
      steps: [{ kind: "find", n: 5, place: "bed" }, { kind: "give", n: 4, to: "Kiwi" }],
    }),
    questions: [
      {
        id: "s5-q0-predict", step: 0, ask: "{hero} finds some more. More or fewer now?", interaction: "predict",
        hints: ["When you find more, do you have fewer?", "Watch the ones that show up.",
          { exampleSay: "6 kites, 3 join. More!", say: "Now you try." }],
        explainChoices: ["Finding more makes more", "I guessed"],
      },
      {
        id: "s5-q1-predict", step: 1, ask: "{hero} gives some away. More or fewer now?", interaction: "predict",
        hints: ["When you give some away, do you keep them?", "Watch the ones that go.",
          { exampleSay: "9 cubs, 2 leave. Fewer!", say: "Now you try." }],
        explainChoices: ["Giving away makes fewer", "I guessed"],
      },
      {
        id: "s5-q2-count", step: "final", ask: "Then {hero} gives some away. How many in all?", interaction: "count",
        hints: ["How many after finding more?", "Count on, then take some away.",
          { exampleSay: "Had 10, found 3, lost 2, now 11.", say: "Now you try." }],
        explainChoices: ["I counted on", "I counted back", "I guessed"],
      },
    ],
    reactions: [
      WRONG_OP,
      { misconception: "echoed-a-given", pip: "{shown} is how many went away. How many stayed?" },
      { misconception: "smaller-from-larger", pip: "{shown} is more than the start. Did any go away?" },
      DIRECTION_FLIP, OFF_BY_ONE, UNKNOWN,
    ],
    source: { ...SOURCE },
  };

  return { id: "nc-2-oa-1-lesson-1", standard: STANDARD, stories: [s1, s2, s3, s4, s5] };
}
