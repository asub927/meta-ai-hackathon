import { describe, expect, it } from "vitest";
import { parseStoryData, validateStory, type StoryData } from "./index.js";
import { stickerStory } from "./fixture.js";

const clone = (): StoryData => JSON.parse(JSON.stringify(stickerStory)) as StoryData;
const codes = (s: StoryData) => validateStory(s).map((i) => i.code);

describe("parseStoryData (boundary)", () => {
  it("accepts the sticker story as JSON and it validates clean", () => {
    const parsed = parseStoryData(JSON.parse(JSON.stringify(stickerStory)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(validateStory(parsed.data)).toEqual([]);
  });
  it("rejects a hint ladder out of order at parse time", () => {
    const bad = clone() as unknown as { questions: { hints: unknown[] }[] };
    bad.questions[0]!.hints = [{ exampleSay: "x", say: "y" }, "a", "b"];
    const parsed = parseStoryData(bad);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.issues.map((i) => i.code)).toContain("invalid-hint-ladder");
  });
  it("rejects an unknown misconception with its specific code", () => {
    const bad = clone() as unknown as { reactions: { misconception: string }[] };
    bad.reactions[0]!.misconception = "made-up-kind";
    const parsed = parseStoryData(bad);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.issues.map((i) => i.code)).toContain("unknown-misconception");
  });
  it("rejects stray fields such as pasted standards text", () => {
    const parsed = parseStoryData({ ...clone(), standardText: "copied text" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.issues.map((i) => i.code)).toContain("invalid-shape");
  });
});

describe("validateStory (rule contract, codes not messages)", () => {
  it("good fixture validates clean", () => expect(validateStory(stickerStory)).toEqual([]));
  it("hand-edited totals fail", () => {
    const s = clone(); (s.solved as { totals: readonly number[] }).totals = [24, 14, 20];
    expect(codes(s)).toContain("totals-mismatch");
  });
  it("a digit typed in a template fails", () => {
    const s = clone(); (s.questions[0] as { ask: string }).ask = "Take 9 away. More or fewer?";
    expect(codes(s)).toContain("digit-in-template");
  });
  it("capacity and negative counts fail", () => {
    const over = clone();
    (over.solved as { problem: object }).problem = { id: "x", standard: "NC.2.OA.1", hero: "Momo", friend: null, item: "sticker", start: 90, steps: [{ kind: "find", n: 20, place: "bed" }] };
    (over.solved as { totals: readonly number[] }).totals = [90, 110]; (over.solved as { answer: number }).answer = 110;
    expect(codes(over)).toContain("count-above-capacity");
    const under = clone();
    (under.solved as { problem: object }).problem = { id: "x", standard: "NC.2.OA.1", hero: "Momo", friend: null, item: "sticker", start: 5, steps: [{ kind: "pop", n: 9 }] };
    (under.solved as { totals: readonly number[] }).totals = [5, -4]; (under.solved as { answer: number }).answer = -4;
    expect(codes(under)).toContain("negative-count");
  });
  it("a worked example sharing a problem number fails", () => {
    const s = clone();
    (s.questions[0]!.hints[2] as { exampleSay: string }).exampleSay = "24 balloons, 2 pop. Fewer!";
    expect(codes(s)).toContain("worked-example-shares-number");
  });
  it("never-wrong wording, long bubbles, gendered words and unknown placeholders fail", () => {
    const wrong = clone(); (wrong.reactions[0] as { pip: string }).pip = "Try again now.";
    expect(codes(wrong)).toContain("never-wrong");
    const long = clone(); (long.questions[0] as { ask: string }).ask = "How many does {hero} have in the sticker book now?";
    expect(codes(long)).toContain("bubble-too-long");
    const gendered = clone(); (gendered.reactions[0] as { pip: string }).pip = "She had {shown} in the book.";
    expect(codes(gendered)).toContain("gendered-word");
    const placeholder = clone(); (placeholder.questions[0] as { ask: string }).ask = "How many {banana} now?";
    expect(codes(placeholder)).toContain("unknown-placeholder");
  });
  it("missing standard, missing source and NC-licensed sources fail", () => {
    const std = clone(); (std.solved.problem as { standard: string }).standard = "";
    expect(codes(std)).toContain("missing-standard");
    const src = clone() as { source?: unknown }; delete src.source;
    expect(codes(src as StoryData)).toContain("missing-source");
    const nc = clone(); nc.source!.licence = "CC BY-NC 4.0";
    expect(codes(nc)).toContain("forbidden-source-licence");
  });
});
