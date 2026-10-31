import { describe, expect, it } from "vitest";
import {
  deriveExplainer,
  solve,
  type ExplainerType,
  type StoryData,
} from "./index.js";
import stickers from "../fixtures/good/stickers.json" with { type: "json" };
import balloons from "../fixtures/good/balloons.json" with { type: "json" };
import startUnknown from "../fixtures/good/start-unknown.json" with { type: "json" };
import compareBigger from "../fixtures/good/compare-bigger.json" with { type: "json" };
import twoStep from "../fixtures/good/two-step.json" with { type: "json" };

/** PR4 rung-3 contract: each template derives its steps from the problem
 *  numbers, and the final derived answer equals the solver output. Expected
 *  strings come from docs/WORKED-EXAMPLE-EXPLAINER.md, not from the code. */
describe("deriveExplainer (same-question derivation per template)", () => {
  it("take-away derives 14 - 6 = 8 in five steps", () => {
    const { answer, steps } = deriveExplainer("take-away", { minuend: 14, subtrahend: 6 });
    expect(answer).toBe(8);
    expect(steps.map((s) => s.id)).toEqual(["question", "show-total", "remove", "count-remainder", "summary"]);
    for (const s of steps) expect(s.text.trim().length).toBeGreaterThan(0);
    expect(steps.at(-1)!.text).toBe("14 take away 6 leaves 8.");
  });
  it("make-10 derives the complement to 10", () => {
    const { answer, steps } = deriveExplainer("make-10", { have: 7 });
    expect(answer).toBe(3);
    expect(steps.map((s) => s.id)).toEqual(["question", "show-frame", "empty", "count-empty", "summary"]);
    for (const s of steps) expect(s.text.trim().length).toBeGreaterThan(0);
    expect(steps.at(-1)!.text).toBe("7 and 3 make 10.");
  });
  it("compare-more derives the difference", () => {
    const { answer, steps } = deriveExplainer("compare-more", { bigger: 11, smaller: 8 });
    expect(answer).toBe(3);
    expect(steps.map((s) => s.id)).toEqual(["question", "line-up", "extras", "count-extras", "summary"]);
    for (const s of steps) expect(s.text.trim().length).toBeGreaterThan(0);
    expect(steps.at(-1)!.text).toBe("11 is 3 more than 8.");
  });
  it("rejects params outside what the solver allows", () => {
    expect(() => deriveExplainer("take-away", { minuend: 6, subtrahend: 14 })).toThrow(/explainer-bad-params/);
    expect(() => deriveExplainer("make-10", { have: 11 })).toThrow(/explainer-bad-params/);
    expect(() => deriveExplainer("compare-more", { bigger: 8, smaller: 11 })).toThrow(/explainer-bad-params/);
    expect(() => deriveExplainer("take-away", { minuend: 14 } as Record<string, number>)).toThrow(/explainer-bad-params/);
    expect(() => deriveExplainer("nope" as ExplainerType, {})).toThrow(/explainer-bad-params/);
  });
});

/** Randomized cross-check: derivation-final equals solve() on the
 *  equivalent problem, for every template. Cheap oracle agreement. */
describe("deriveExplainer agrees with the solver (seeded cross-check)", () => {
  it("matches solve() on 300 random cases per type", () => {
    let seed = 987654321;
    const rand = (n: number): number => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    const base = { id: "x", standard: "NC.2.OA.1", hero: "h", friend: null, item: "i" };
    for (let i = 0; i < 300; i++) {
      const minuend = 1 + rand(60), subtrahend = rand(minuend + 1);
      expect(deriveExplainer("take-away", { minuend, subtrahend }).answer,
        `take-away ${minuend} - ${subtrahend}`).toBe(
        solve({ ...base, start: minuend, steps: [{ kind: "pop", n: subtrahend }] }).answer);
    }
    for (let i = 0; i < 300; i++) {
      const have = rand(11);
      expect(deriveExplainer("make-10", { have }).answer, `make-10 have ${have}`).toBe(
        solve({ ...base, start: have, unknown: "change", result: 10, steps: [{ kind: "find", n: 0, place: "bed" }] }).answer);
    }
    for (let i = 0; i < 300; i++) {
      const bigger = rand(61), smaller = rand(bigger + 1);
      expect(deriveExplainer("compare-more", { bigger, smaller }).answer,
        `compare-more ${bigger} vs ${smaller}`).toBe(
        solve({ ...base, start: 0, steps: [], compare: { relation: "difference", reference: smaller, difference: 0, heroCount: bigger } }).answer);
    }
  });
});

const good: [string, unknown][] = [
  ["stickers", stickers], ["balloons", balloons], ["start-unknown", startUnknown],
  ["compare-bigger", compareBigger], ["two-step", twoStep],
];

const numbersOf = (solved: StoryData["solved"]): Set<number> => new Set<number>([
  solved.problem.start,
  ...solved.problem.steps.map((s) => s.n),
  ...solved.totals, solved.answer,
  ...(solved.problem.result !== undefined ? [solved.problem.result] : []),
  ...(solved.problem.compare
    ? [solved.problem.compare.reference, solved.problem.compare.difference,
      ...(solved.problem.compare.heroCount !== undefined ? [solved.problem.compare.heroCount] : [])]
    : []),
]);

/** Every shipped explainer is built from the current problem numbers, and
 *  the shipped steps are exactly what the derivation produces. */
describe("good fixture explainers derive from their own problem", () => {
  it.each(good)("%s: params are problem numbers, steps equal the derivation", (_name, json) => {
    const story = json as unknown as StoryData;
    const allowed = numbersOf(story.solved);
    for (const q of story.questions) {
      const explainer = q.hints[2];
      for (const v of Object.values(explainer.params))
        expect(allowed.has(v), `${q.id}: param ${v} is not a problem number`).toBe(true);
      expect(explainer.steps).toEqual(deriveExplainer(explainer.type, explainer.params).steps);
    }
  });
});
