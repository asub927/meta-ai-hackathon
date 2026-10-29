import { describe, expect, it } from "vitest";
import { buildLesson1, loadLesson } from "./index.js";
import { validateStory } from "./index.js";
import lessonJson from "../../../lessons/nc-2-oa-1-lesson-1.json" with { type: "json" };

const loaded = loadLesson(lessonJson);
if (!loaded.ok) throw new Error(`committed lesson 1 failed to load: ${JSON.stringify(loaded.issues)}`);

describe("lesson 1 (NC.2.OA.1)", () => {
  it("committed JSON loads clean", () => {
    expect(loadLesson(lessonJson).ok).toBe(true);
  });
  it("has 5 stories with answers [24, 25, 25, 24, 8]", () => {
    expect(loaded.lesson.id).toBe("nc-2-oa-1-lesson-1");
    expect(loaded.lesson.standard).toBe("NC.2.OA.1");
    expect(loaded.lesson.stories).toHaveLength(5);
    expect(loaded.lesson.stories.map((s) => s.solved.answer)).toEqual([24, 25, 25, 24, 8]);
  });
  it("each story validates clean", () => {
    for (const story of loaded.lesson.stories) expect(validateStory(story)).toEqual([]);
  });
  it("committed JSON stories deep-equal buildLesson1().stories", () => {
    expect(loaded.lesson.stories).toEqual(buildLesson1().stories);
  });
});
