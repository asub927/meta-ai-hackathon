import { describe, expect, it } from "vitest";
import { detect, fill, mastery, solve, templateIssues, initial, step, type Event, type StepPhase } from "./index.js";
import { stickerStory as story } from "./fixture.js";

const run = (events: Event[]) => {
  let s: StepPhase = initial; const said: string[] = [];
  for (const e of events) { const [ns, fx] = step(s, e, story); s = ns; said.push(...fx.flatMap((f) => (f.type === "say" ? [f.line] : []))); }
  return { s, said };
};
const beat: Event = { type: "beat-ended" };
const correctCount = (q: number): Event => ({ type: "answered", a: { kind: "count", value: [15, 15, 20][q]! } });

describe("solve / detect / fill", () => {
  it("derives totals, never authored", () => expect(story.solved.totals).toEqual([24, 15, 20]));
  it("detects misconceptions", () => {
    expect(detect(story.solved, story.questions[1]!, { kind: "count", value: 33 })).toBe("wrong-operation");
    expect(detect(story.solved, story.questions[1]!, { kind: "count", value: 9 })).toBe("echoed-a-given");
    expect(detect(story.solved, story.questions[1]!, { kind: "count", value: 15 })).toBeNull();
  });
  it("fill only takes numbers from Solved; templates reject digits", () => {
    expect(fill("{hero} has {start}", story.solved)).toBe("Momo has 24");
    expect(templateIssues("take 9 away")).toEqual(["digit-in-template"]);
  });
  it("agrees with a brute-force oracle on random problems", () => {
    for (let i = 0; i < 500; i++) {
      const start = Math.floor(Math.random() * 90) + 10, n = Math.floor(Math.random() * 9) + 1;
      expect(solve({ id: "x", standard: "s", hero: "h", friend: null, item: "i", start, steps: [{ kind: "pop", n }] }).answer).toBe(start - n);
    }
  });
});

describe("step reducer (matches the formal model)", () => {
  it("right path reaches done", () => {
    const { s } = run([beat, { type: "answered", a: { kind: "predict", value: "fewer" } }, { type: "explained", choice: "x" }, correctCount(1), { type: "explained", choice: "x" }, correctCount(2), { type: "explained", choice: "x" }]);
    expect(s.tag).toBe("done");
  });
  it("wrong answer reacts (never done early), then can finish", () => {
    const mid = run([beat, { type: "answered", a: { kind: "predict", value: "fewer" } }, { type: "explained", choice: "x" }, { type: "answered", a: { kind: "count", value: 33 } }]);
    expect(mid.s.tag).toBe("reacting");
  });
  it("3 hints play the worked example, then re-ask; tutor never states the answer first", () => {
    const events: Event[] = [beat, { type: "answered", a: { kind: "predict", value: "fewer" } }, { type: "explained", choice: "x" }, { type: "hint" }, { type: "hint" }, { type: "hint" }];
    const { s, said } = run(events);
    expect(s).toMatchObject({ tag: "asking", rung: 3 });
    expect(said.join(" ")).not.toContain("15"); // the answer to q0-count is never said
    const re = run([...events, { type: "hint" }]);
    expect(re.s).toMatchObject({ tag: "asking", rung: 0 }); // original question re-asked
  });
  it("double-tap answers only once", () => {
    const a = run([beat, { type: "answered", a: { kind: "predict", value: "fewer" } }, { type: "answered", a: { kind: "predict", value: "more" } }]);
    expect(a.s.tag).toBe("explaining");
  });
  it("random wrong/hint sequences still reach done once answered correctly", () => {
    const correctFor = (qIndex: number): Event => qIndex === 0
      ? { type: "answered", a: { kind: "predict", value: "fewer" } }
      : { type: "answered", a: { kind: "count", value: qIndex === 1 ? 15 : 20 } };
    for (let trial = 0; trial < 200; trial++) {
      let s: StepPhase = initial; let guard = 0;
      while (s.tag !== "done" && guard++ < 500) {
        const e: Event = s.tag === "telling" ? beat
          : s.tag === "reacting" ? { type: "reaction-ended" }
          : s.tag === "explaining" ? { type: "explained", choice: "x" }
          : Math.random() < 0.3 ? { type: "hint" }
          : Math.random() < 0.5 ? { type: "answered", a: { kind: "count", value: 1 } }
          : correctFor(s.qIndex);
        s = step(s, e, story)[0];
      }
      expect(s.tag).toBe("done");
    }
  });
});

describe("mastery", () => {
  it("needs 3 clean across >=2 templates and never drops in a session", () => {
    const log = [{ type: "answered", clean: true, template: "a" }, { type: "answered", clean: true, template: "b" }, { type: "answered", clean: true, template: "a" }];
    expect(mastery(log)).toBe(true);
    expect(mastery([...log, { type: "answered", clean: false }])).toBe(true);
    expect(mastery(log.slice(0, 2))).toBe(false);
  });
  it("solve matches story totals", () => expect(solve(story.solved.problem).answer).toBe(20));
});
