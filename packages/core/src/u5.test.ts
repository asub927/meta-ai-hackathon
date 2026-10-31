import { describe, expect, it } from "vitest";
import { detect, initial, step, stickerStory as story, targetFor, type Answer, type Event, type StepPhase } from "./index.js";

const beat: Event = { type: "beat-ended" };
const reactEnd: Event = { type: "reaction-ended" };
const explained: Event = { type: "explained", choice: "x" };
const fewer: Event = { type: "answered", a: { kind: "predict", value: "fewer" } };
const count = (value: number): Event => ({ type: "answered", a: { kind: "count", value } });

/** Events that drive the reducer to `asking` for question `qIndex` (rung 0). */
const askFor = (qIndex: number): Event[] => {
  if (qIndex === 0) return [beat];
  if (qIndex === 1) return [beat, fewer, explained];
  return [beat, fewer, explained, count(15), explained];
};

const run = (events: Event[]) => {
  let s: StepPhase = initial;
  const said: string[] = [];
  for (const e of events) {
    const [ns, fx] = step(s, e, story);
    s = ns;
    said.push(...fx.flatMap((f) => (f.type === "say" ? [f.line] : [])));
  }
  return { s, said };
};

describe("U5 acceptance: right answers run asking -> explaining -> done", () => {
  it("full chain across all three questions", () => {
    const chain: Array<{ e: Event; tag: StepPhase["tag"]; qIndex?: number }> = [
      { e: beat, tag: "asking", qIndex: 0 },
      { e: fewer, tag: "explaining", qIndex: 0 },
      { e: explained, tag: "asking", qIndex: 1 },
      { e: count(15), tag: "explaining", qIndex: 1 },
      { e: explained, tag: "asking", qIndex: 2 },
      { e: count(20), tag: "explaining", qIndex: 2 },
      { e: explained, tag: "done" },
    ];
    let s: StepPhase = initial;
    for (const { e, tag, qIndex } of chain) {
      [s] = [step(s, e, story)[0]];
      expect(s.tag).toBe(tag);
      if (qIndex !== undefined) expect((s as { qIndex: number }).qIndex).toBe(qIndex);
    }
  });
});

describe("U5 acceptance: detected misconceptions react then re-ask", () => {
  const cases: Array<{ id: string; qIndex: number; a: Answer; line: string }> = [
    { id: "wrong-operation", qIndex: 1, a: { kind: "count", value: 33 }, line: "If Momo had 33, where did they come from?" },
    { id: "echoed-a-given", qIndex: 1, a: { kind: "count", value: 9 }, line: "9 is how many flew away. How many stayed?" },
    { id: "off-by-one", qIndex: 1, a: { kind: "count", value: 16 }, line: "So close. Let's count together." },
    { id: "direction-flip", qIndex: 0, a: { kind: "predict", value: "more" }, line: "Did Momo get more, or give some away?" },
    // 42 on the final question matches no specific pattern, so it falls back
    // to the "unknown" reaction line.
    { id: "unknown", qIndex: 2, a: { kind: "count", value: 42 }, line: "Let's count together, slowly." },
  ];
  it.each(cases)("$id: asking -> reacting -> asking (re-asks at rung 0)", ({ qIndex, a, line, id }) => {
    const { s: ask } = run(askFor(qIndex));
    expect(ask).toMatchObject({ tag: "asking", qIndex, rung: 0 });
    const [reacting, fx] = step(ask, { type: "answered", a }, story);
    expect(reacting.tag).toBe("reacting");
    expect((reacting as { reaction: { misconception: string } }).reaction.misconception).toBe(id);
    expect(fx.flatMap((f) => (f.type === "say" ? [f.line] : []))).toEqual([line]);
    const [reask, fx2] = step(reacting, reactEnd, story);
    expect(reask).toMatchObject({ tag: "asking", qIndex, rung: 0 });
    expect(fx2.flatMap((f) => (f.type === "say" ? [f.line] : []))).toHaveLength(1);
  });
});

describe("U5 acceptance: hint ladder and double-tap", () => {
  it("hints climb 0 -> 1 -> 2 -> 3 (worked example), then re-ask at rung 0", () => {
    let s: StepPhase = initial;
    const said: string[] = [];
    const send = (e: Event) => {
      const [ns, fx] = step(s, e, story);
      s = ns;
      said.push(...fx.flatMap((f) => (f.type === "say" ? [f.line] : [])));
    };
    ([...askFor(1), { type: "hint" }, { type: "hint" }, { type: "hint" }] as Event[]).forEach(send);
    expect(s).toMatchObject({ tag: "asking", qIndex: 1, rung: 3 });
    // Rung 3 opens the explainer panel; the main story flow only re-states
    // the question, so the target never appears in a `say`.
    expect(said.join(" ")).toContain("How many does Momo have now?");
    expect(said.join(" ")).not.toContain("15");
    send({ type: "hint" });
    expect(s).toMatchObject({ tag: "asking", qIndex: 1, rung: 0 });
  });
  it("double-tap: answered while explaining is ignored, state unchanged", () => {
    const { s: explaining } = run([beat, fewer]);
    expect(explaining.tag).toBe("explaining");
    const [ns, fx] = step(explaining, { type: "answered", a: { kind: "predict", value: "more" } }, story);
    expect(fx).toEqual([]);
    expect(ns).toEqual(explaining);
  });
});

describe("U5 property: 1000 seeded sequences reach done, tutor never leaks the target", () => {
  it("mulberry32(12345) driver: hint / wrong-count / correct", () => {
    // Deterministic PRNG so the whole sweep reproduces byte for byte.
    const rand = (() => {
      let a = 12345 >>> 0;
      return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    })();
    const correctFor = (qIndex: number): Event =>
      qIndex === 0
        ? { type: "answered", a: { kind: "predict", value: "fewer" } }
        : { type: "answered", a: { kind: "count", value: targetFor(story.solved, story.questions[qIndex]!) } };
    for (let seq = 0; seq < 1000; seq++) {
      let s: StepPhase = initial;
      const answeredCorrectly = new Set<number>();
      let guard = 0;
      while (s.tag !== "done" && guard++ < 500) {
        let e: Event;
        if (s.tag === "telling") e = beat;
        else if (s.tag === "reacting") e = reactEnd;
        else if (s.tag === "explaining") e = explained;
        else {
          const q = story.questions[s.qIndex]!;
          const r = rand();
          if (r < 0.3) e = { type: "hint" };
          else if (r < 0.65) {
            let value = Math.floor(rand() * 101);
            if (q.interaction === "count" && value === targetFor(story.solved, q)) value = (value + 1) % 101;
            e = { type: "answered", a: { kind: "count", value } };
          } else e = correctFor(s.qIndex);
          if (e.type === "answered" && detect(story.solved, q, e.a) === null) answeredCorrectly.add(s.qIndex);
        }
        const [ns, fx] = step(s, e, story);
        // Leak invariant: every `say` emitted while answering question q, before
        // q's correct answer, must not contain q's target as an integer token.
        // - Rung 3 opens the explainer PANEL; its steps never travel in a `say`.
        //   The rung-3 `say` only re-states the question (a template, so no
        //   digits after fill), which is why no worked-example exemption exists.
        // - Reaction lines may echo the child's own `shown` value (filtered out
        //   below) but must still never state the target.
        // - Ask/hint lines are checked strictly: no exemptions.
        const postQ = (ns as { qIndex?: number }).qIndex;
        if (postQ !== undefined && !answeredCorrectly.has(postQ)) {
          const q = story.questions[postQ]!;
          const target = targetFor(story.solved, q);
          for (const f of fx) {
            if (f.type !== "say") continue;
            let tokens = (f.line.match(/\d+/g) ?? []).map(Number);
            if (ns.tag === "reacting") tokens = tokens.filter((t) => t !== ns.shown); // child-echo exemption
            expect(tokens, `seq ${seq}: say line leaks target ${target} for q${postQ}: ${JSON.stringify(f.line)}`).not.toContain(target);
          }
        }
        s = ns;
      }
      expect(s.tag, `seq ${seq} did not reach done`).toBe("done");
    }
  });
});

describe("U5 detect sweep: null iff correct", () => {
  for (const qIndex of [1, 2] as const) {
    it(`q${qIndex}: detect(...) === null iff value === target`, () => {
      const q = story.questions[qIndex]!;
      const target = targetFor(story.solved, q);
      for (let value = 0; value <= 100; value++) {
        const got = detect(story.solved, q, { kind: "count", value });
        if (value === target) expect(got, `q${qIndex} value ${value}`).toBeNull();
        else {
          expect(got, `q${qIndex} value ${value}`).not.toBeNull();
          expect(typeof got).toBe("string");
        }
      }
    });
  }
});
