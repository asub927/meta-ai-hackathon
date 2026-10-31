import { describe, expect, it } from "vitest";
import { parseStoryData, validateStory } from "./index.js";
import stickers from "../fixtures/good/stickers.json" with { type: "json" };
import balloons from "../fixtures/good/balloons.json" with { type: "json" };
import startUnknown from "../fixtures/good/start-unknown.json" with { type: "json" };
import compareBigger from "../fixtures/good/compare-bigger.json" with { type: "json" };
import twoStep from "../fixtures/good/two-step.json" with { type: "json" };
import totalsEdited from "../fixtures/bad/totals-edited.json" with { type: "json" };
import digitTemplate from "../fixtures/bad/digit-in-template.json" with { type: "json" };
import aboveCapacity from "../fixtures/bad/above-capacity.json" with { type: "json" };
import negative from "../fixtures/bad/negative.json" with { type: "json" };
import hintOrder from "../fixtures/bad/hint-order.json" with { type: "json" };
import workedEmptyStep from "../fixtures/bad/worked-empty-step.json" with { type: "json" };
import workedWrongAnswer from "../fixtures/bad/worked-wrong-answer.json" with { type: "json" };
import tryAgain from "../fixtures/bad/try-again.json" with { type: "json" };
import bubbleLong from "../fixtures/bad/bubble-too-long.json" with { type: "json" };
import gendered from "../fixtures/bad/gendered.json" with { type: "json" };
import unknownMisconception from "../fixtures/bad/unknown-misconception.json" with { type: "json" };
import ncSource from "../fixtures/bad/nc-source.json" with { type: "json" };
import noStandard from "../fixtures/bad/no-standard.json" with { type: "json" };
import pastedText from "../fixtures/bad/pasted-standard-text.json" with { type: "json" };

const good: [string, unknown][] = [
  ["stickers", stickers], ["balloons", balloons], ["start-unknown", startUnknown],
  ["compare-bigger", compareBigger], ["two-step", twoStep],
];
const bad: [string, unknown, string][] = [
  ["totals-edited", totalsEdited, "totals-mismatch"],
  ["digit-in-template", digitTemplate, "digit-in-template"],
  ["above-capacity", aboveCapacity, "count-above-capacity"],
  ["negative", negative, "negative-count"],
  ["hint-order", hintOrder, "invalid-hint-ladder"],
  ["worked-empty-step", workedEmptyStep, "explainer-empty-step"],
  ["worked-wrong-answer", workedWrongAnswer, "explainer-answer-mismatch"],
  ["try-again", tryAgain, "never-wrong"],
  ["bubble-too-long", bubbleLong, "bubble-too-long"],
  ["gendered", gendered, "gendered-word"],
  ["unknown-misconception", unknownMisconception, "unknown-misconception"],
  ["nc-source", ncSource, "forbidden-source-licence"],
  ["no-standard", noStandard, "missing-standard"],
  ["pasted-standard-text", pastedText, "invalid-shape"],
];

describe("U4 fixtures", () => {
  it.each(good)("good fixture %s parses and validates clean", (_name, json) => {
    const parsed = parseStoryData(json);
    expect(parsed.ok, parsed.ok ? "" : JSON.stringify(parsed.issues)).toBe(true);
    if (parsed.ok) expect(validateStory(parsed.data)).toEqual([]);
  });
  it.each(bad)("bad fixture %s fails with %s", (_name, json, code) => {
    const parsed = parseStoryData(json);
    const codes = parsed.ok ? validateStory(parsed.data).map((i) => i.code) : parsed.issues.map((i) => i.code);
    expect(codes).toContain(code);
    // A bad fixture that parses must not also pass validation.
    if (parsed.ok) expect(codes.length).toBeGreaterThan(0);
  });
});
