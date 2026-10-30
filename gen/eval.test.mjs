// U15 eval units: reading-level math and line collection. No gateway.
import { execSync } from "node:child_process";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
execSync("pnpm --filter @kids-math/core exec tsc -p tsconfig.cli.json", { cwd: ROOT, stdio: "pipe" });

const core = await import("../packages/core/.validate-dist/index.js");
const { countSyllables, fkGrade, storyLines } = await import("./eval.mjs");

const story = {
  solved: core.solve({
    id: "t", standard: "NC.2.OA.1", hero: "Momo", friend: "Kiwi", item: "shell",
    start: 10, steps: [{ kind: "give", n: 3, to: "Kiwi" }],
  }),
  questions: [{
    id: "q", step: 0, ask: "{hero} gives some away. More or fewer now?",
    interaction: "predict",
    hints: ["Do you keep them?", "Watch them go.",
      { exampleSay: "6 kites, 2 leave. Fewer!", say: "Now you try." }],
    explainChoices: ["Giving away makes fewer"],
  }],
  reactions: [{ misconception: "unknown", pip: "Count together, slowly." }],
  source: { url: "u", licence: "CC BY-SA 4.0", changes: "Test." },
};

describe("reading level", () => {
  it("counts syllables on plain words", () => {
    assert.equal(countSyllables("cat"), 1);
    assert.equal(countSyllables("balloons"), 2);
    assert.equal(countSyllables("together"), 3);
  });

  it("grades a simple sentence near grade 0", () => {
    const g = fkGrade("The cat sat.");
    assert.ok(g < 2, `expected a low grade, got ${g}`);
  });

  it("collects every child-facing line filled", () => {
    const lines = storyLines(core, story);
    assert.equal(lines.length, 1 + 2 + 2 + 1 + 1);
    assert.ok(lines[0].startsWith("Momo gives"));
    assert.ok(lines.every((l) => !/\{\w+\}/.test(l)));
  });
});
