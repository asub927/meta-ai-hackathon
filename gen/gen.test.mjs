// U14 tests: node --test gen/ (build core first, like render/).
// CI replays gen/cache and never touches the network.

import { execSync } from "node:child_process";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFileSync } from "node:fs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
execSync("pnpm --filter @kids-math/core exec tsc -p tsconfig.cli.json", { cwd: ROOT, stdio: "pipe" });

const core = await import("../packages/core/.validate-dist/index.js");
const { loadSpec, problemFromSpec, skeletonFor } = await import("./spec.mjs");
const { generateDraft, shapeIssues } = await import("./draft.mjs");
const { completeWithCache } = await import("./llm.mjs");

const SPEC = JSON.parse(readFileSync(new URL("./examples/stickers-31-12.spec.json", import.meta.url), "utf8"));
const GOOD = JSON.parse(
  JSON.parse(readFileSync(new URL("./cache/gen-stickers-31-12.attempt1.json", import.meta.url), "utf8")).content,
);

const source = { url: "https://example.org/t", licence: "CC BY-SA 4.0", changes: "Test." };

/** Cache-backed client in replay mode: the CI path, no network. */
const replayClient = async ({ key }) =>
  (await completeWithCache({ key, mode: "replay", request: {}, live: () => { throw new Error("must not call live"); } })).text;

const cleanLines = (skeleton) => ({
  lines: Object.fromEntries(skeleton.map((q) => [q.id, {
    ask: q.interaction === "predict" ? "More or fewer now?" : "How many are there now?",
    hints: ["A smaller question?", "Watch closely.",
      { exampleSay: "6 kites, 2 leave. Fewer!", say: "Now you try." }],
    explainChoices: ["I counted", "I guessed"],
  }])),
  reactions: {
    "wrong-operation": "Where did the rest go?", "echoed-a-given": "Count what stayed.",
    "smaller-from-larger": "Look again slowly.", "direction-flip": "More, or fewer?",
    "off-by-one": "So close. Count again.", unknown: "Count together, slowly.",
  },
});

describe("spec", () => {
  it("derives totals [31,19] and a predict+count skeleton by code", () => {
    const spec = loadSpec(SPEC);
    const solved = core.solve(problemFromSpec(spec));
    assert.deepEqual(solved.totals, [31, 19]);
    assert.equal(solved.answer, 19);
    const skel = skeletonFor(solved, spec.id);
    assert.deepEqual(skel.map((q) => [q.id, q.step, q.interaction]), [
      ["gen-stickers-31-12-q0-predict", 0, "predict"],
      ["gen-stickers-31-12-qfinal-count", "final", "count"],
    ]);
  });

  it("rejects a spec without an NCDPI standard", () => {
    assert.throws(() => loadSpec({ ...SPEC, standard: "grade 2" }), /invalid-spec/);
  });
});

describe("generateDraft", () => {
  it("validates the recorded cache response with solver-derived numbers", async () => {
    const result = await generateDraft(core, loadSpec(SPEC), replayClient);
    assert.equal(result.status, "validated");
    assert.equal(result.story.solved.answer, 19);
    assert.deepEqual(result.story.solved.totals, [31, 19]);
    assert.equal(result.story.questions.length, 2);
    assert.equal(result.story.reactions.length, 6);
  });

  it("ignores numeric fields the model returns", async () => {
    const hacked = JSON.stringify({ ...GOOD, answer: 999, totals: [0] });
    const result = await generateDraft(core, loadSpec(SPEC), async () => hacked);
    assert.equal(result.status, "validated");
    assert.equal(result.story.solved.answer, 19);
  });

  it("rejects the red-team draft twice, then hands slots to a human", async () => {
    const poison = (id) => ({
      ask: "Momo has 15 left! try again, count!",
      hints: ["Momo has 15 left! try again!", "wrong, guess again.", { exampleSay: "try again!", say: "try again!" }],
      explainChoices: ["try again"],
    });
    const skeleton = skeletonFor(core.solve(problemFromSpec(loadSpec(SPEC))), SPEC.id);
    const text = JSON.stringify({
      lines: Object.fromEntries(skeleton.map((q) => [q.id, poison(q.id)])),
      reactions: Object.fromEntries(
        ["wrong-operation", "echoed-a-given", "smaller-from-larger", "direction-flip", "off-by-one", "unknown"]
          .map((id) => [id, "try again, Momo has 15 left!"])),
    });
    let calls = 0;
    const result = await generateDraft(core, loadSpec(SPEC), async () => { calls++; return text; });
    assert.equal(calls, 2);
    assert.equal(result.status, "needs-human");
    assert.equal(result.story, null);
    assert.ok(result.issues.some((i) => i.code === "digit-in-template"));
    assert.ok(result.issues.some((i) => i.code === "never-wrong"));
    assert.ok(result.slots.length > 0);
  });

  it("retries once with issues and validates the fixed draft", async () => {
    const skeleton = skeletonFor(core.solve(problemFromSpec(loadSpec(SPEC))), SPEC.id);
    const bad = JSON.stringify({
      ...cleanLines(skeleton),
      lines: { ...cleanLines(skeleton).lines, [skeleton[0].id]: { ...cleanLines(skeleton).lines[skeleton[0].id], ask: "Momo has 15 left!" } },
    });
    const texts = [bad, JSON.stringify(cleanLines(skeleton))];
    const seen = [];
    const result = await generateDraft(core, loadSpec(SPEC), async ({ user }) => { seen.push(user); return texts.shift(); });
    assert.equal(result.status, "validated");
    assert.equal(seen.length, 2);
    assert.match(seen[1], /digit-in-template/);
  });

  it("parses a word problem, then derives everything by code", async () => {
    const spec = loadSpec({
      id: "gen-words-7-5", standard: "NC.2.OA.1", hero: "Momo", friend: null,
      item: "shell", source, problem: { words: "Momo finds 5 shells on the bed." },
    });
    const result = await generateDraft(core, spec, async ({ key }) => {
      if (key.endsWith(".parse")) return JSON.stringify({ start: 7, steps: [{ kind: "find", n: 5, place: "bed" }] });
      const skel = skeletonFor(core.solve(problemFromSpec(loadSpec({ ...SPEC, id: "gen-words-7-5" }))), "gen-words-7-5");
      return JSON.stringify(cleanLines(skel));
    });
    assert.equal(result.status, "validated");
    assert.deepEqual(result.story.solved.totals, [7, 12]);
  });

  it("fails closed when the cache is absent in replay mode", async () => {
    await assert.rejects(replayClient({ key: "no-such-key" }), /missing-cache/);
  });
});

describe("shapeIssues", () => {
  it("flags a missing reaction before the validator runs", () => {
    const issues = shapeIssues({ lines: {}, reactions: {} }, [{ id: "q", step: "final", interaction: "count" }]);
    assert.ok(issues.some((i) => i.code === "missing-line"));
    assert.ok(issues.some((i) => i.code === "missing-reaction"));
  });
});
