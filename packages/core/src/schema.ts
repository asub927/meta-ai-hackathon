import { z } from "zod";
import type { Issue, StoryData } from "./types.js";

/** Boundary parse (PLAN.md §3, STACK §3): JSON in, trusted StoryData out.
 *  Shape only — number rules live in `validateStory`. Strict objects reject
 *  stray fields (e.g. pasted standards text) at the boundary. */
const stepSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("give"), n: z.number(), to: z.string() }),
  z.strictObject({ kind: z.literal("pop"), n: z.number() }),
  z.strictObject({ kind: z.literal("find"), n: z.number(), place: z.enum(["bed", "gift"]) }),
  z.strictObject({ kind: z.literal("receive"), n: z.number(), from: z.string() }),
]);

const problemSchema = z.strictObject({
  id: z.string(), standard: z.string(), hero: z.string(), friend: z.string().nullable(),
  item: z.string(), start: z.number(), steps: z.array(stepSchema),
  unknown: z.enum(["start", "change", "result"]).optional(),
  result: z.number().optional(),
  compare: z.strictObject({
    relation: z.enum(["bigger", "smaller", "difference"]), reference: z.number(),
    difference: z.number(), heroCount: z.number().optional(),
  }).optional(),
});

const questionSchema = z.strictObject({
  id: z.string(), step: z.union([z.number(), z.literal("final")]), ask: z.string(),
  interaction: z.enum(["predict", "count"]),
  hints: z.tuple([z.string(), z.string(), z.strictObject({ exampleSay: z.string(), say: z.string() })]),
  explainChoices: z.array(z.string()),
});

export const storyDataSchema = z.strictObject({
  solved: z.strictObject({
    problem: problemSchema, totals: z.array(z.number()), answer: z.number(),
  }),
  questions: z.array(questionSchema).min(1),
  reactions: z.array(z.strictObject({
    misconception: z.enum(["wrong-operation", "echoed-a-given", "off-by-one", "smaller-from-larger", "direction-flip", "unknown"]),
    pip: z.string(),
    smaller: questionSchema.optional(),
  })).min(1),
  source: z.strictObject({ url: z.string(), licence: z.string(), changes: z.string() }).optional(),
});

export type ParseResult = { ok: true; data: StoryData } | { ok: false; issues: Issue[] };

export function parseStoryData(json: unknown): ParseResult {
  const parsed = storyDataSchema.safeParse(json);
  if (parsed.success) return { ok: true, data: parsed.data as StoryData };
  const issues: Issue[] = parsed.error.issues.map((i) => {
    const path = i.path.join(".");
    const code = path.includes("misconception") ? "unknown-misconception"
      : path.includes("hints") ? "invalid-hint-ladder" : "invalid-shape";
    return { code, path, message: i.message };
  });
  return { ok: false, issues };
}
