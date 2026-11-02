import { execSync } from "node:child_process";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
execSync("pnpm --filter @kids-math/core exec tsc -p tsconfig.cli.json", { cwd: ROOT, stdio: "pipe" });

const { computeCoverage, exitCodeForRows, templateKey } = await import("./coverage-content.mjs");

const story = (id, problem, totals) => ({ solved: { problem, totals, answer: totals[totals.length - 1] } });

const problem = (id, overrides = {}) => ({
  id,
  standard: "NC.2.OA.1",
  item: "shell",
  start: 1,
  steps: [{ kind: "give", n: 1 }],
  ...overrides,
});

describe("templateKey", () => {
  it("separates compare shapes from step shapes and unknown positions", () => {
    assert.equal(templateKey(problem("a")), "result:give");
    assert.equal(templateKey(problem("b", { unknown: "start" })), "start:give");
    assert.equal(templateKey(problem("c", { compare: { relation: "bigger" }, steps: [] })), "compare:bigger");
    assert.equal(templateKey(problem("d", { steps: [{ kind: "find" }, { kind: "give" }] })), "result:find,give");
  });
});

describe("computeCoverage", () => {
  it("counts distinct shapes, items, bands and problem ids per problem standard", () => {
    const lessons = [
      {
        status: "validated",
        stories: [
          story("one", problem("p1", { item: "shell" }), [10]),
          story("two", problem("p2", { item: "book", unknown: "start" }), [30]),
          story("three", problem("p3", { item: "book", steps: [], compare: { relation: "smaller" } }), [80]),
        ],
      },
      {
        stories: [
          story("dup", problem("p1", { item: "shell" }), [10]),
          story("other", problem("p4", { standard: "NC.2.NBT.5", item: "coin", steps: [{ kind: "receive" }] }), [15]),
        ],
      },
    ];
    const rows = computeCoverage(lessons);
    assert.deepEqual(rows, [
      { standard: "NC.2.NBT.5", templates: 1, contexts: 1, ladderSteps: 1, instances: 1, approved: 0, meetsTarget: false },
      { standard: "NC.2.OA.1", templates: 3, contexts: 2, ladderSteps: 3, instances: 3, approved: 0, meetsTarget: false },
    ]);
  });

  it("counts approved stories only from files at approved status", () => {
    const lessons = [
      { status: "approved", stories: [story("a", problem("a1"), [5]), story("b", problem("a2"), [6])] },
      { status: "validated", stories: [story("c", problem("a3"), [7])] },
      { status: "draft", stories: [story("d", problem("a4"), [8])] },
      { stories: [story("e", problem("a5"), [9])] },
    ];
    const [row] = computeCoverage(lessons);
    assert.equal(row.approved, 2);
    assert.equal(row.instances, 5);
  });

  it("marks a standard as meeting target only when every count reaches target", () => {
    const shapes = [
      { steps: [{ kind: "give" }] },
      { steps: [{ kind: "receive" }] },
      { steps: [{ kind: "find" }] },
      { steps: [{ kind: "pop" }] },
      { steps: [], compare: { relation: "bigger" } },
      { steps: [], compare: { relation: "smaller" } },
    ];
    const stories = [];
    for (let i = 0; i < 150; i++) {
      const shape = shapes[i % shapes.length];
      const max = [10, 30, 80][i % 3];
      stories.push(story(`s${i}`, problem(`inst-${i}`, { item: `item-${i % 4}`, ...shape }), [max]));
    }
    const [row] = computeCoverage([{ status: "approved", stories }]);
    assert.deepEqual(row, {
      standard: "NC.2.OA.1", templates: 6, contexts: 4, ladderSteps: 3, instances: 150, approved: 150, meetsTarget: true,
    });
    assert.equal(exitCodeForRows([row]), 0);
  });
});

describe("exitCodeForRows", () => {
  it("passes when a standard holds no approved content yet", () => {
    assert.equal(exitCodeForRows([
      { standard: "NC.2.OA.1", templates: 0, contexts: 0, ladderSteps: 0, instances: 0, approved: 0, meetsTarget: false },
    ]), 0);
  });

  it("fails when approved content sits below target", () => {
    const [row] = computeCoverage([
      { status: "approved", stories: [story("a", problem("only"), [5])] },
    ]);
    assert.equal(row.approved, 1);
    assert.equal(row.meetsTarget, false);
    assert.equal(exitCodeForRows([row]), 1);
  });

  it("passes when every approved standard meets target", () => {
    assert.equal(exitCodeForRows([
      { standard: "NC.2.OA.1", templates: 6, contexts: 4, ladderSteps: 3, instances: 150, approved: 3, meetsTarget: true },
    ]), 0);
  });
});
