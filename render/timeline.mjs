// U13 timeline: pure Node simulation of the wrong-then-right child path.
// Simulates the reducer (initial/step/detect/choreograph from core) for a
// scripted path. No DOM, no I/O, no Date, no Math.random.

import {
  choreograph, detect, loadLesson, parseStoryData, step, targetFor, validateStory,
} from "../packages/core/.validate-dist/index.js";

const SCENE = { reducedMotion: false };
const EXPLAIN_HOLD_MS = 900;
const DONE_HOLD_MS = 1200;

/** Correct predict value for a question (mirrors core isCorrect). */
function correctPredict(solved, q) {
  const idx = q.step === "final" ? solved.problem.steps.length - 1 : q.step;
  const st = solved.problem.steps[idx];
  if (!st) return "same";
  const n = solved.problem.unknown === "change" && st.n === 0 ? solved.answer : st.n;
  const d = st.kind === "give" || st.kind === "pop" ? -n : n;
  return d > 0 ? "more" : d < 0 ? "fewer" : "same";
}

/** Wrong-but-flagged predict: first of more/fewer/same that detect() flags. */
function wrongPredict(solved, q) {
  for (const v of ["more", "fewer", "same"]) {
    const a = { kind: "predict", value: v };
    if (detect(solved, q, a) !== null) return a;
  }
  throw new Error(`no flaggable predict for ${q.id}`);
}

/** Candidate wrong counts in the fixed order from the U13 brief:
 *  wrong-operation total, echoed start, target+1, direction-flip total.
 *  Returns the first that detect() flags (and is not the correct answer). */
function wrongCount(solved, q) {
  const target = targetFor(solved, q);
  const cands = [];
  if (solved.problem.steps.length) {
    const stepIdx = q.step === "final" ? solved.problem.steps.length - 1 : q.step;
    const st = solved.problem.steps[stepIdx];
    const stepN = Math.abs(solved.problem.unknown === "change" && st.n === 0 ? solved.answer : st.n);
    const isAdd = st.kind === "find" || st.kind === "receive";
    const d = isAdd ? stepN : -stepN;
    const before = solved.totals[stepIdx];
    cands.push(before - d); // wrong-operation total (did the opposite operation)
    cands.push(solved.totals[0]); // echoed start (the starting pile)
    cands.push(target + 1); // target+1 (off by one)
    cands.push(before - d); // direction-flip total (total in the flipped direction)
  } else {
    // Compare problem: no step to echo or flip; opposite operation on reference ± difference.
    const { relation, reference, difference } = solved.problem.compare;
    const heroCount = solved.problem.compare.heroCount;
    cands.push(relation === "bigger" ? reference - difference : reference + (heroCount ?? difference));
    cands.push(reference); // echoed given
    cands.push(target + 1); // target+1
    cands.push(relation === "bigger" ? reference - difference : reference + (heroCount ?? difference));
  }
  const seen = new Set();
  for (const value of cands) {
    if (value === target || seen.has(value)) continue;
    seen.add(value);
    const a = { kind: "count", value };
    if (detect(solved, q, a) !== null) return a;
  }
  // Guaranteed flagged (off-by-one) unless it collides with target (impossible here).
  const fallback = { kind: "count", value: target + 1 };
  if (detect(solved, q, fallback) !== null) return fallback;
  throw new Error(`no flaggable count for ${q.id}`);
}

/** Load + validate a lesson file: a LessonFile ({stories:[...]}) or a single StoryData (wrapped). */
export function loadLessonFile(json) {
  if (json !== null && typeof json === "object" && !Array.isArray(json) && Array.isArray(json.stories)) {
    const res = loadLesson(json);
    if (!res.ok) throw new Error(`lesson invalid: ${res.issues.map((i) => i.code).join(",")}`);
    return res.lesson;
  }
  const parsed = parseStoryData(json);
  if (!parsed.ok) throw new Error(`story invalid: ${parsed.issues.map((i) => i.code).join(",")}`);
  const issues = validateStory(parsed.data);
  if (issues.length) throw new Error(`story invalid: ${issues.map((i) => i.code).join(",")}`);
  return { id: "single-story", standard: json?.solved?.problem?.standard ?? "NC.2.OA.1", stories: [parsed.data] };
}

/** Build the deterministic timeline for a lesson file object + path name.
 *  Returns {segments, cues, totalMs, actions} where each segment carries the
 *  UI actions that reach it, and cues carry absolute ms + kind. */
export function buildTimeline(lessonFile, pathName) {
  if (pathName !== "wrong-then-right") throw new Error(`unknown path: ${pathName}`);
  const lesson = loadLessonFile(lessonFile);
  const segments = [];
  const cues = [];
  const actions = [];
  // Actions deferred to the next ask segment (explain-first / next-story clicks
  // transition INTO the next asking state, so the driver performs them first).
  const pendingAskActions = [];
  let t = 0;

  const pushBeat = (storyIndex, script, segActions) => {
    const seg = {
      kind: "beat", storyIndex, script, durationMs: script.durationMs,
      startMs: t, actions: segActions,
    };
    for (const c of script.cues) cues.push({ atMs: t + c.atMs, kind: c.kind });
    t += script.durationMs;
    segments.push(seg);
    actions.push(...segActions);
    return seg;
  };
  const pushHold = (storyIndex, holdKind, durationMs, segActions) => {
    const seg = { kind: "hold", holdKind, storyIndex, durationMs, startMs: t, actions: segActions };
    t += durationMs;
    segments.push(seg);
    actions.push(...segActions);
    return seg;
  };

  lesson.stories.forEach((story, storyIndex) => {
    const { solved } = story;
    let phase = { tag: "telling" };
    const sim = (ev) => {
      const [ns] = step(phase, ev, story);
      phase = ns;
      return ns;
    };
    // Fresh page load lands on telling; the driver clicks Start + lesson button first.
    sim({ type: "beat-ended" });
    if (phase.tag !== "asking") throw new Error(`story ${storyIndex}: expected asking after beat-ended`);

    story.questions.forEach((q, qi) => {
      const beatScript = (qq) => choreograph(SCENE, solved, { kind: "beat", question: qq });
      // Ask segment: reached by previous explain-first / next-story, or by nothing (first question).
      const askActions = pendingAskActions.splice(0, pendingAskActions.length);
      pushBeat(storyIndex, beatScript(q), askActions);
      if (phase.tag !== "asking" || phase.qIndex !== qi)
        throw new Error(`story ${storyIndex} q ${q.id}: simulated phase is not asking`);

      // Wrong answer -> reacting.
      const wrong = q.interaction === "predict" ? wrongPredict(solved, q) : wrongCount(solved, q);
      const miss = detect(solved, q, wrong);
      if (miss === null) throw new Error(`story ${storyIndex} q ${q.id}: wrong answer not flagged`);
      const afterWrong = sim({ type: "answered", a: wrong });
      if (afterWrong.tag !== "reacting") throw new Error(`story ${storyIndex} q ${q.id}: no reaction`);
      const reaction = afterWrong.reaction;
      const shown = afterWrong.shown;
      const reactionScript = choreograph(SCENE, solved, { kind: "reaction", reaction, shown });
      const wrongAction = q.interaction === "predict"
        ? { type: "predict", value: wrong.value }
        : { type: "count", value: wrong.value };
      pushBeat(storyIndex, reactionScript, [wrongAction]);

      // Keep going -> re-ask.
      const afterKeep = sim({ type: "reaction-ended" });
      if (afterKeep.tag !== "asking") throw new Error(`story ${storyIndex} q ${q.id}: no re-ask`);
      pushBeat(storyIndex, beatScript(q), [{ type: "keep-going" }]);

      // Correct answer -> explaining hold (900ms, no beat).
      const correct = q.interaction === "predict"
        ? { kind: "predict", value: correctPredict(solved, q) }
        : { kind: "count", value: targetFor(solved, q) };
      if (detect(solved, q, correct) !== null)
        throw new Error(`story ${storyIndex} q ${q.id}: correct answer flagged`);
      const afterRight = sim({ type: "answered", a: correct });
      if (afterRight.tag !== "explaining") throw new Error(`story ${storyIndex} q ${q.id}: no explaining`);
      const correctAction = q.interaction === "predict"
        ? { type: "predict", value: correct.value }
        : { type: "count", value: correct.value };
      pushHold(storyIndex, "explaining", EXPLAIN_HOLD_MS, [correctAction]);

      // Explain-first -> next asking, next story, or done.
      const choice = q.explainChoices[0];
      if (choice === undefined) throw new Error(`story ${storyIndex} q ${q.id}: no explain choices`);
      const afterExplain = sim({ type: "explained", choice });
      const lastQ = qi === story.questions.length - 1;
      if (lastQ) {
        if (afterExplain.tag !== "done") throw new Error(`story ${storyIndex}: expected done`);
        const lastStory = storyIndex === lesson.stories.length - 1;
        if (lastStory) {
          pushHold(storyIndex, "done", DONE_HOLD_MS, [{ type: "explain-first" }]);
        } else {
          pushHold(storyIndex, "done", DONE_HOLD_MS, [{ type: "explain-first" }]);
          pendingAskActions.push({ type: "next-story" });
        }
      } else {
        if (afterExplain.tag !== "asking") throw new Error(`story ${storyIndex} q ${q.id}: expected next asking`);
        pendingAskActions.push({ type: "explain-first" });
      }
    });
  });

  // Cues must be monotonic non-decreasing (segments are sequential).
  for (let i = 1; i < cues.length; i++) {
    if (cues[i].atMs < cues[i - 1].atMs) throw new Error("cues not monotonic");
  }
  return { segments, cues, totalMs: t, actions };
}
