import { describe, expect, test } from "vitest";
import { validateStory } from "@kids-math/core";
import {
  buildLesson,
  buildProblem,
  buildStory,
  defaultDraft,
  draftIssues,
  explainerFor,
  validateDraftStory,
  type AuthorDraft,
} from "./author";

const draft = (patch: Partial<AuthorDraft> = {}): AuthorDraft => ({ ...defaultDraft(), ...patch });

describe("solver owns every number", () => {
  test("start-unknown derives the start, never the teacher", () => {
    const story = buildStory(draft({ kind: "take-from-start", result: 15, change: 9 }));
    expect(story.solved.totals).toEqual([24, 15]);
    expect(story.solved.answer).toBe(24);
  });

  test("changing one given moves every derived number", () => {
    const before = buildStory(draft({ kind: "take-from-start", result: 15, change: 9 }));
    const after = buildStory(draft({ kind: "take-from-start", result: 15, change: 6 }));
    expect(after.solved.answer).toBe(21);
    expect(after.solved.totals).not.toEqual(before.solved.totals);
  });

  test("compare and two-step answers come from the solver", () => {
    expect(buildStory(draft({ kind: "compare-bigger", reference: 18, difference: 7 })).solved.answer).toBe(25);
    expect(buildStory(draft({ kind: "compare-smaller", reference: 32, difference: 8 })).solved.answer).toBe(24);
    const two = buildStory(draft({ kind: "two-step", start: 7, change: 5, secondChange: 4 }));
    expect(two.solved.totals).toEqual([7, 12, 8]);
    expect(two.solved.answer).toBe(8);
  });

  test("problem carries the draft givens, solved carries the rest", () => {
    const problem = buildProblem(draft({ kind: "add-to-start", result: 31, change: 6 }));
    expect(problem.result).toBe(31);
    expect(buildStory(draft({ kind: "add-to-start", result: 31, change: 6 })).solved.answer).toBe(25);
  });
});

describe("output passes the core validator", () => {
  const kinds = [
    draft({ kind: "take-from-result", start: 20, change: 5 }),
    draft({ kind: "add-to-result", start: 20, change: 5 }),
    draft({ kind: "take-from-start", result: 15, change: 9 }),
    draft({ kind: "add-to-start", result: 31, change: 6 }),
    draft({ kind: "compare-bigger", reference: 18, difference: 7 }),
    draft({ kind: "compare-smaller", reference: 32, difference: 8 }),
    draft({ kind: "two-step", start: 7, change: 5, secondChange: 4 }),
  ] as AuthorDraft[];
  for (const d of kinds) {
    test(`${d.kind} validates clean`, () => {
      expect(validateStory(buildStory(d))).toEqual([]);
      expect(validateDraftStory(d)).toEqual([]);
    });
  }

  test("lesson file shape loads through the boundary loader", () => {
    const lesson = buildLesson(draft({ lessonId: "teacher-shells-start", kind: "take-from-start", result: 15, change: 9 }));
    expect(lesson.id).toBe("teacher-shells-start");
    expect(lesson.stories).toHaveLength(1);
    expect(lesson.stories[0]!.questions.length).toBeGreaterThan(0);
  });

  test("misconception picks become the reaction set", () => {
    const story = buildStory(draft({ misconceptions: ["off-by-one", "unknown"] }));
    expect(story.reactions.map((r) => r.misconception)).toEqual(["off-by-one", "unknown"]);
    expect(validateStory(story)).toEqual([]);
  });
});

describe("rung 3 derives the same question", () => {
  test("take-from-result explainer states the derived answer last", () => {
    const d = draft({ kind: "take-from-result", start: 20, change: 5 });
    const story = buildStory(d);
    const explainer = story.questions[0]!.hints[2];
    expect(explainer.type).toBe("take-away");
    expect(explainer.params).toEqual({ minuend: 20, subtrahend: 5 });
    expect(explainer.steps[explainer.steps.length - 1]!.text).toContain("15");
    expect(validateStory(story)).toEqual([]);
  });

  test("every kind produces a derivation the validator accepts", () => {
    const kinds = [
      draft({ kind: "take-from-result", start: 9, change: 2 }),
      draft({ kind: "add-to-result", start: 20, change: 5 }),
      draft({ kind: "take-from-start", result: 15, change: 9 }),
      draft({ kind: "add-to-start", result: 31, change: 6 }),
      draft({ kind: "compare-bigger", reference: 18, difference: 7 }),
      draft({ kind: "compare-smaller", reference: 32, difference: 8 }),
      draft({ kind: "two-step", start: 7, change: 5, secondChange: 4 }),
    ] as AuthorDraft[];
    for (const d of kinds) {
      const story = buildStory(d);
      const explainer = explainerFor(d, story.solved);
      expect(explainer.steps.length).toBeGreaterThan(0);
      for (const s of explainer.steps) expect(s.text.trim()).not.toBe("");
      expect(validateStory(story)).toEqual([]);
    }
  });
});

describe("draft guardrails", () => {
  test("bad input is reported before any file exists", () => {
    expect(draftIssues(draft({ hero: "" }))).not.toEqual([]);
    expect(draftIssues(draft({ hero: "Supercalifragil" }))).not.toEqual([]);
    expect(draftIssues(draft({ standard: "CCSS 2.OA.1" }))).not.toEqual([]);
    expect(draftIssues(draft({ misconceptions: [] }))).not.toEqual([]);
    expect(draftIssues(draft({ kind: "take-from-result", start: 5, change: 9 }))).not.toEqual([]);
  });

  test("solver rejections surface as issues, never throw to the page", () => {
    expect(validateDraftStory(draft({ kind: "take-from-result", start: 5, change: 9 }))[0]!.code).toBe("solver-error");
  });
});
