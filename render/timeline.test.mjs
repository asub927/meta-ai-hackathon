// U13 timeline tests. Run: `node --test render/` (needs core dist; the
// before() hook below builds it with `pnpm tsc` if it is missing).
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const distIndex = path.join(root, "packages/core/.validate-dist/index.js");
const lessonPath = path.join(root, "lessons/nc-2-oa-1-lesson-1.json");

let timeline;
let core;

before(() => {
  if (!existsSync(distIndex)) {
    execSync("pnpm --filter @kids-math/core exec tsc -p tsconfig.cli.json", { cwd: root, stdio: "inherit" });
  }
  return Promise.all([
    import("./timeline.mjs").then((m) => { timeline = m; }),
    import("../packages/core/.validate-dist/index.js").then((m) => { core = m; }),
  ]);
});

const lessonJson = () => JSON.parse(readFileSync(lessonPath, "utf8"));

describe("timeline", () => {
  it("ends in done for all 5 stories", () => {
    const tl = timeline.buildTimeline(lessonJson(), "wrong-then-right");
    assert.strictEqual(tl.segments.filter((s) => s.kind === "hold" && s.holdKind === "done").length, 5);
    // Last segment is the final lesson-done hold.
    const last = tl.segments[tl.segments.length - 1];
    assert.strictEqual(last.kind, "hold");
    assert.strictEqual(last.holdKind, "done");
    // Every story contributes at least one segment.
    for (let i = 0; i < 5; i++) {
      assert.ok(tl.segments.some((s) => s.storyIndex === i), `story ${i} has segments`);
    }
  });

  it("every count question has a wrong action detect() flags + a later correct action", () => {
    const tl = timeline.buildTimeline(lessonJson(), "wrong-then-right");
    const lesson = timeline.loadLessonFile(lessonJson());
    const countActions = tl.actions.filter((a) => a.type === "count");
    assert.ok(countActions.length > 0);
    let idx = 0;
    lesson.stories.forEach((story) => {
      story.questions.forEach((q) => {
        if (q.interaction !== "count") return;
        const wrong = countActions[idx++];
        assert.ok(wrong, `count q ${q.id} has a wrong action`);
        const miss = core.detect(story.solved, q, { kind: "count", value: wrong.value });
        assert.notStrictEqual(miss, null, `wrong ${wrong.value} flagged for ${q.id}`);
        const right = countActions[idx++];
        assert.ok(right, `count q ${q.id} has a correct action`);
        assert.strictEqual(core.detect(story.solved, q, { kind: "count", value: right.value }), null);
        assert.strictEqual(right.value, core.targetFor(story.solved, q));
      });
    });
  });

  it("every predict question has a wrong direction + a later correct direction", () => {
    const tl = timeline.buildTimeline(lessonJson(), "wrong-then-right");
    const lesson = timeline.loadLessonFile(lessonJson());
    const predictActions = tl.actions.filter((a) => a.type === "predict");
    let idx = 0;
    lesson.stories.forEach((story) => {
      story.questions.forEach((q) => {
        if (q.interaction !== "predict") return;
        const wrong = predictActions[idx++];
        assert.strictEqual(core.detect(story.solved, q, { kind: "predict", value: wrong.value }) !== null, true);
        const right = predictActions[idx++];
        assert.strictEqual(core.detect(story.solved, q, { kind: "predict", value: right.value }), null);
      });
    });
  });

  it("cues monotonic non-decreasing, durations match choreograph, totalMs > 0", () => {
    const tl = timeline.buildTimeline(lessonJson(), "wrong-then-right");
    assert.ok(tl.totalMs > 0);
    for (let i = 1; i < tl.cues.length; i++) {
      assert.ok(tl.cues[i].atMs >= tl.cues[i - 1].atMs, "cues monotonic");
    }
    const lesson = timeline.loadLessonFile(lessonJson());
    const scene = { reducedMotion: false };
    for (const seg of tl.segments) {
      if (seg.kind === "hold") {
        assert.ok(seg.durationMs === 900 || seg.durationMs === 1200);
        continue;
      }
      const story = lesson.stories[seg.storyIndex];
      const expected = seg.script.id.startsWith("reaction:")
        ? core.choreograph(scene, story.solved, {
          kind: "reaction",
          reaction: story.reactions.find((r) => `reaction:${r.misconception}` === seg.script.id),
          shown: seg.script.bookCount,
        })
        : core.choreograph(scene, story.solved, {
          kind: "beat",
          question: story.questions.find((q) => `beat:${q.id}` === seg.script.id),
        });
      assert.strictEqual(seg.durationMs, expected.durationMs, `${seg.script.id} duration`);
      assert.deepStrictEqual(seg.script, expected);
    }
    const sum = tl.segments.reduce((a, s) => a + s.durationMs, 0);
    assert.strictEqual(tl.totalMs, sum);
  });

  it("same build twice is deep-equal (deterministic)", () => {
    const a = timeline.buildTimeline(lessonJson(), "wrong-then-right");
    const b = timeline.buildTimeline(lessonJson(), "wrong-then-right");
    assert.deepStrictEqual(a, b);
  });

  it("throws on unknown path", () => {
    assert.throws(() => timeline.buildTimeline(lessonJson(), "happy"), /unknown path/);
  });

  it("explaining choices always use the first choice", () => {
    const tl = timeline.buildTimeline(lessonJson(), "wrong-then-right");
    const explains = tl.actions.filter((a) => a.type === "explain-first");
    // One explain per question: 2+2+1+1+3 = 9.
    assert.strictEqual(explains.length, 9);
  });
});
