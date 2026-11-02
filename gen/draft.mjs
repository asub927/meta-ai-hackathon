// U14 draft assembly: prompt -> model JSON -> StoryData -> validate ->
// one retry -> validated or human slots. Code owns every number: solved
// comes from solve(), never from the model. The model writes LineTemplates
// only, and any numeric field it returns is ignored, never read.

import { REACTION_IDS, problemFromSpec, skeletonFor } from "./spec.mjs";

const MAX_LINE = 30;

function stepWords(solved, q) {
  if (q.interaction === "count") {
    if (solved.problem.compare) return `asks how many ${solved.problem.hero} has in the comparison`;
    if (q.step === "final") return "asks for the final count after all steps";
    return `asks for the count after step ${Number(q.step) + 1}`;
  }
  const idx = q.step === "final" ? solved.problem.steps.length - 1 : q.step;
  const s = solved.problem.steps[idx];
  if (!s) return "asks whether there are more or fewer";
  const verb = s.kind === "give" ? "gives some away" : s.kind === "pop" ? "sees some vanish"
    : s.kind === "find" ? "finds some more" : "receives some more";
  return `a step where ${solved.problem.hero} ${verb}; asks whether that means more or fewer`;
}

function systemPrompt(solved) {
  const allowed = showPlaceholders(allowedPlaceholders(solved.problem, solved));
  return [
    "You write story lines for a Socratic math tutor. The tutor never states the answer.",
    "It asks one short question, the child acts, the story reacts. A wrong answer is",
    "never marked wrong: no red X, no wrong, no incorrect, no try again, no saying no.",
    "",
    "RULES FOR EVERY LINE YOU WRITE:",
    `- Placeholders only, from this list: ${allowed}. Reactions may also use {shown}.`,
    "- Never write a digit 0-9 in any line.",
    "- Never write a number word (one, two, three, ... twenty).",
    `- Keep every line under ${MAX_LINE} characters; the app rejects bubbles over 45 after filling.`,
    "- Refer to the child-facing characters only with {hero} or they/them/their.",
    "  Never he, she, him, her, his, hers.",
    "- Ask exactly one thing per line. No compound questions.",
    "- Hints climb in this order: 1. a smaller question 2. a visual cue",
    "  (watch, point, make tens). The third hint, the worked example, is",
    "  derived by code from the story numbers, so you do not write it.",
    "- Reaction lines comfort and redirect with {shown} where it fits.",
    "  They never contain the answer and never shame.",
    "",
    "OUTPUT: one JSON object only, no prose around it:",
    '{"lines": {"<questionId>": {"ask": "...", "hints": ["...", "..."],',
    '  "explainChoices": ["...", "..."]}, ...},',
    ` "reactions": {${REACTION_IDS.map((id) => `"${id}": "..."`).join(", ")}}`,
    "Write every question id listed in the task, and all six reaction ids above, spelled exactly as shown.",
  ].join("\n");
}

function taskPrompt(solved, skeleton) {
  const p = solved.problem;
  const cast = `Hero {hero} is ${p.hero}. ${p.friend ? `Friend is ${p.friend}. ` : ""}Items: {item} (${p.item}).`;
  const lines = skeleton.map((q) => `- ${q.id} (${q.interaction}): ${stepWords(solved, q)}`).join("\n");
  return [
    `STANDARD: ${p.standard}. SITUATION: ${p.id}.`,
    cast,
    "QUESTIONS TO WRITE:",
    lines,
    `REACTION IDS: ${REACTION_IDS.join(", ")}.`,
  ].join("\n");
}

function retryPrompt(previous, issues) {
  return [
    "Your last draft failed validation. Fix every issue below and return the full JSON again.",
    "Do not explain. Return only the corrected JSON object.",
    `Reaction ids must be exactly these six, spelled exactly as shown: ${REACTION_IDS.join(", ")}.`,
    "Never invent other ids.",
    "ISSUES:",
    ...issues.map((i) => `- ${i.path} [${i.code}]: ${i.message}`),
    "YOUR LAST DRAFT:",
    previous,
  ].join("\n");
}

/** Prompt for the surgical repair pass: only the missing reaction pips, not
 *  the whole draft. Reactions sit at the end of the longest outputs, so a
 *  draft that drops trailing ids is under output-budget pressure; re-asking
 *  for the full JSON reproduces the same pressure and fails the same way.
 *  A pips-only object is a few lines and has no tail to drop. */
function repairPrompt(missingIds, solved) {
  const banned = bannedPlaceholders(solved.problem, solved);
  const allowed = showPlaceholders(
    ["hero", "item", "shown"].concat(["start", "result"].filter((n) => !banned.has(n))));
  return [
    "Some reaction lines are missing from the story draft. Write ONLY these reaction ids:",
    ...missingIds.map((id) => `- ${id}`),
    "",
    "RULES FOR EVERY LINE YOU WRITE:",
    `- Placeholders only, from this list: ${allowed}.`,
    "- Never write a digit 0-9 in any line.",
    "- Never write a number word (one, two, three, ... twenty).",
    "- Refer to the child-facing characters only with {hero} or they/them/their.",
    "- Reaction lines comfort and redirect. They never contain the answer and never shame:",
    "  no wrong, no incorrect, no try again, no saying no.",
    "",
    "OUTPUT: one JSON object only, no prose around it:",
    `{"reactions": {${missingIds.map((id) => `"${id}": "..."`).join(", ")}}`,
  ].join("\n");
}

/** Merge repaired pips into the previous draft. Returns the merged model,
 *  or null when the repair text is not a JSON object with a reactions map. */
export function mergeRepair(model, missingIds, text) {
  let repaired = null;
  try { repaired = JSON.parse(text); } catch { repaired = null; }
  if (repaired === null || typeof repaired !== "object" || Array.isArray(repaired)) return null;
  const pips = repaired.reactions;
  if (!pips || typeof pips !== "object") return null;
  const reactions = { ...(model.reactions ?? {}) };
  for (const id of missingIds) {
    if (typeof pips[id] === "string") reactions[id] = pips[id];
  }
  return { ...model, reactions };
}

/** Flag model lines using a placeholder that resolves to the answer.
 *  Runs after the shape check (so every scanned line is a string) and before
 *  assembly, so a leak fails closed without a derived story. */
function placeholderIssues(solved, skeleton, model) {
  const banned = bannedPlaceholders(solved.problem, solved);
  const issues = [];
  const scan = (template, path, isQuestion) => {
    for (const [name, value] of banned) {
      if (template.includes(`{${name}}`)) issues.push({
        code: "banned-placeholder", path,
        message: `{${name}} resolves to ${value}, the answer; restate without it`,
      });
    }
    if (isQuestion && template.includes("{shown}")) issues.push({
      code: "banned-placeholder", path,
      message: "{shown} is a runtime slot for reactions only; restate without it",
    });
  };
  for (const q of skeleton) {
    const l = model.lines[q.id];
    scan(l.ask, `lines.${q.id}.ask`, true);
    scan(l.hints[0], `lines.${q.id}.hints.0`, true);
    scan(l.hints[1], `lines.${q.id}.hints.1`, true);
    l.explainChoices.forEach((c, i) => scan(c, `lines.${q.id}.explainChoices.${i}`, true));
  }
  for (const id of REACTION_IDS) scan(model.reactions[id], `reactions.${id}`, false);
  return issues;
}

/** Shape-check one parsed model object, then assemble and validate it. */
function evaluate(core, spec, solved, skeleton, model) {
  const shaped = shapeIssues(model, skeleton);
  if (shaped.length) return { ok: false, story: null, issues: shaped };
  const leaked = placeholderIssues(solved, skeleton, model);
  if (leaked.length) return { ok: false, story: null, issues: leaked };
  const { story, issues } = assembleStory(core, spec, solved, skeleton, model);
  if (!issues.length && story) return { ok: true, story, issues: [] };
  return { ok: false, story: null, issues };
}

/** Validate one model object against a spec: shape-check, assemble,
 *  validate. Shared by generateDraft and the repair CLI. */
export function validateModel(core, spec, model) {
  const solved = core.solve(problemFromSpec(spec));
  const skeleton = skeletonFor(solved, spec.id);
  const evaluated = evaluate(core, spec, solved, skeleton, model);
  if (evaluated.ok) return { status: "validated", story: evaluated.story, slots: [], issues: [] };
  return {
    status: "needs-human", story: null,
    slots: evaluated.issues.map(toSlot), issues: evaluated.issues,
  };
}

/** Placeholders that state the answer for a (problem, solved) pair, mapped
 *  to the value each resolves to under fill(). `{answer}` and `{missing}`
 *  always resolve to the answer. `{start}` is the derived start, so it leaks
 *  only on start-unknown stories. `{result}` falls back to the answer when
 *  the problem has no known final total, so it leaks unless the known result
 *  differs from the answer. Question lines must also never use `{shown}`:
 *  a runtime slot for reaction pips only. */
export function bannedPlaceholders(problem, solved) {
  const banned = new Map([
    ["answer", solved.answer],
    ["missing", solved.answer],
  ]);
  if ((problem.unknown ?? "result") === "start") banned.set("start", solved.totals[0]);
  if (!(problem.result !== undefined && problem.result !== solved.answer))
    banned.set("result", problem.result ?? solved.answer);
  return banned;
}

/** Question-line placeholders the model may use: givens only, never leaks. */
function allowedPlaceholders(problem, solved) {
  const banned = bannedPlaceholders(problem, solved);
  return ["hero", "item", "start", "result"].filter((n) => !banned.has(n));
}

const showPlaceholders = (names) => names.map((n) => `{${n}}`).join(" ");

/** Words-kind phase 1: the model parses a word problem into Problem params.
 *  Code re-derives and re-validates everything after; model numbers are input,
 *  never output. */
export function wordsParsePrompt(text) {
  return [
    systemPromptForParse(),
    "Parse the word problem into problem params. Return one JSON object only:",
    '{"unknown": "start|change|result (omit for result)", "start": <number or 0 for start-unknown>,',
    ' "result": <known final total for start/change-unknown>, "steps": [{"kind": "give|pop|find|receive",',
    ' "n": <number or 0 for the change-unknown step>, "to|from|place": ...}],',
    ' or "compare": {"relation": "bigger|smaller|difference", "reference": <n>, "difference": <n>}}.',
    `WORD PROBLEM: ${text}`,
  ].join("\n");
}

function systemPromptForParse() {
  return [
    "You parse a grade-2 word problem into structured params. Return JSON only.",
    "Use unknown start when the start is missing, change when one step size is missing.",
    "Compare problems have no steps: use compare with reference and difference.",
  ].join("\n");
}

/** Shape-check the model's draft JSON into issues. Never throws. */
export function shapeIssues(model, skeleton) {
  const issues = [];
  const add = (code, path, message) => issues.push({ code, path, message });
  if (model === null || typeof model !== "object" || Array.isArray(model)) {
    add("invalid-model-json", "", "model output is not a JSON object");
    return issues;
  }
  const lines = model.lines;
  if (!lines || typeof lines !== "object") add("invalid-model-json", "lines", "lines must be an object");
  else for (const q of skeleton) {
    const l = lines[q.id];
    if (!l || typeof l !== "object") { add("missing-line", `lines.${q.id}`, `no lines for ${q.id}`); continue; }
    if (typeof l.ask !== "string") add("missing-line", `lines.${q.id}.ask`, "ask must be a string");
    if (!Array.isArray(l.hints) || l.hints.length !== 2 || typeof l.hints[0] !== "string" || typeof l.hints[1] !== "string")
      add("invalid-hint-ladder", `lines.${q.id}.hints`, "hints must be [smaller question, visual cue]; the worked example is derived by code");
    if (!Array.isArray(l.explainChoices) || !l.explainChoices.every((c) => typeof c === "string"))
      add("missing-line", `lines.${q.id}.explainChoices`, "explainChoices must be strings");
  }
  const reactions = model.reactions;
  if (!reactions || typeof reactions !== "object") add("invalid-model-json", "reactions", "reactions must be an object");
  else for (const id of REACTION_IDS) {
    if (typeof reactions[id] !== "string") add("missing-reaction", `reactions.${id}`, `no pip for ${id}`);
  }
  return issues;
}

/** Rung 3 is a same-question derivation (docs/WORKED-EXAMPLE-EXPLAINER.md):
 *  deriveExplainer plugs the solver's numbers into the template matching the
 *  story shape. Mirrors the web authoring tool's explainerFor
 *  (apps/web/src/author/author.ts), keyed off Problem structure instead of
 *  the teacher-facing draft kind. Add, find, and two-step stories retrace one
 *  take-away step; comparisons use compare-more except smaller-without-count,
 *  which retraces take-away. A retrace explains where the numbers came from,
 *  so the explainer's own answer may differ from the story answer; the core
 *  validator checks the derivation against its own numbers. */
export function explainerShapeFor(problem, solved) {
  const totals = solved.totals;
  const last = totals[totals.length - 1];
  if (problem.compare) {
    const c = problem.compare;
    if (c.relation === "smaller" && c.heroCount === undefined)
      return { type: "take-away", params: { minuend: c.reference, subtrahend: c.difference } };
    const counts = c.heroCount !== undefined ? [c.heroCount, c.reference] : [solved.answer, c.reference];
    return { type: "compare-more", params: { bigger: Math.max(...counts), smaller: Math.min(...counts) } };
  }
  const steps = problem.steps;
  const lastStep = steps[steps.length - 1];
  const before = totals[totals.length - 2];
  const change = lastStep.n === 0 ? Math.abs(last - before) : lastStep.n;
  if (lastStep.kind === "give") {
    const minuend = steps.length === 1
      ? (problem.unknown === "start" ? solved.answer : problem.start)
      : before;
    return { type: "take-away", params: { minuend, subtrahend: change } };
  }
  return { type: "take-away", params: { minuend: last, subtrahend: change } };
}

function assembleStory(core, spec, solved, skeleton, model) {
  const shape = explainerShapeFor(solved.problem, solved);
  let derived;
  try {
    derived = core.deriveExplainer(shape.type, shape.params);
  } catch (e) {
    return { issues: [{ code: "explainer-bad-params", path: "solved.problem", message: e instanceof Error ? e.message : String(e) }] };
  }
  const explainer = { type: shape.type, params: shape.params, steps: [...derived.steps] };
  const questions = skeleton.map((q) => {
    const l = model.lines[q.id];
    return {
      id: q.id, step: q.step, ask: l.ask, interaction: q.interaction,
      hints: [l.hints[0], l.hints[1], explainer],
      explainChoices: l.explainChoices,
    };
  });
  const reactions = REACTION_IDS.map((id) => ({ misconception: id, pip: model.reactions[id] }));
  const story = { solved, questions, reactions, source: { ...spec.source } };
  const parsed = core.parseStoryData(story);
  if (!parsed.ok) return { issues: parsed.issues };
  return { story: parsed.data, issues: core.validateStory(parsed.data) };
}

const toSlot = (i) => `${i.path} [${i.code}]: ${i.message}`;

/** Full unit: spec -> validated draft or human slots. `client` is an async
 *  ({system, user, key}) => text, so tests inject fakes and the CLI injects
 *  the cached gateway. Attempts: initial, a pips-only repair when only
 *  reactions are missing, one full retry with issues fed back, then a final
 *  pips-only repair when only reactions are still missing. */
export async function generateDraft(core, spec, client) {
  let problem;
  if (spec.problem.words !== undefined) {
    const raw = await client({ system: systemPromptForParse(), user: wordsParsePrompt(spec.problem.words), key: `${spec.id}.parse` });
    let parsedParams;
    try { parsedParams = JSON.parse(raw); } catch { parsedParams = null; }
    if (!parsedParams || typeof parsedParams !== "object")
      return { status: "needs-human", story: null, slots: ["parse [invalid-model-json]: word problem did not parse"], issues: [] };
    problem = {
      id: spec.id, standard: spec.standard, hero: spec.hero, friend: spec.friend, item: spec.item,
      start: parsedParams.start ?? 0, steps: parsedParams.steps ?? [],
      ...(parsedParams.unknown ? { unknown: parsedParams.unknown } : {}),
      ...(parsedParams.result !== undefined ? { result: parsedParams.result } : {}),
      ...(parsedParams.compare ? { compare: parsedParams.compare } : {}),
    };
  } else {
    problem = problemFromSpec(spec);
  }
  let solved;
  try {
    solved = core.solve(problem);
  } catch (e) {
    const code = e instanceof Error && /^[a-z][a-z-]+/.test(e.message) ? e.message.split(":")[0] : "solver-error";
    return { status: "needs-human", story: null, slots: [`solved.problem [${code}]: ${e instanceof Error ? e.message : String(e)}`], issues: [] };
  }
  const skeleton = skeletonFor(solved, spec.id);
  const system = systemPrompt(solved);
  const user = taskPrompt(solved, skeleton);

  // Attempt 1: the full draft.
  const first = await client({ system, user, key: `${spec.id}.attempt1` });
  let model = null;
  try { model = JSON.parse(first); } catch { model = null; }
  let evaluated = evaluate(core, spec, solved, skeleton, model);
  if (evaluated.ok) return { status: "validated", story: evaluated.story, slots: [], issues: [] };

  // Tail-drop repair: the model wrote valid lines but stopped before the
  // last reaction ids, or filled them with invented ids. Re-asking for the
  // full JSON reproduces the same output-budget pressure (and the retry can
  // reinforce invented ids by quoting them back), so ask only for the
  // missing pips and merge them in code. Anything else still gets the full
  // retry below.
  const repaired = await tryRepair(core, spec, solved, skeleton, system, client, model, evaluated.issues, 1);
  if (repaired !== null) {
    if (repaired.ok) return { status: "validated", story: repaired.story, slots: [], issues: [] };
    return {
      status: "needs-human", story: null,
      slots: repaired.issues.map(toSlot), issues: repaired.issues,
    };
  }

  // Attempt 2: the full draft again, with the issues fed back. When this
  // still leaves only missing reactions (dropped or invented ids), one
  // pips-only repair gets the last word instead of another full rewrite.
  const second = await client({ system, user: retryPrompt(first, evaluated.issues), key: `${spec.id}.attempt2` });
  let retry = null;
  try { retry = JSON.parse(second); } catch { retry = null; }
  evaluated = evaluate(core, spec, solved, skeleton, retry);
  if (evaluated.ok) return { status: "validated", story: evaluated.story, slots: [], issues: [] };
  const repaired2 = await tryRepair(core, spec, solved, skeleton, system, client, retry, evaluated.issues, 2);
  if (repaired2 !== null) {
    if (repaired2.ok) return { status: "validated", story: repaired2.story, slots: [], issues: [] };
    evaluated = repaired2;
  }
  return {
    status: "needs-human", story: null,
    slots: evaluated.issues.map(toSlot), issues: evaluated.issues,
  };
}

/** One pips-only repair round for missing reactions. Returns the fresh
 *  evaluation, or null when the shape is not a repair candidate (model
 *  unparseable, no issues, or issues beyond missing reactions). */
async function tryRepair(core, spec, solved, skeleton, system, client, model, issues, round) {
  if (model === null || issues.length === 0 || !issues.every((i) => i.code === "missing-reaction")) return null;
  const missingIds = [...new Set(issues.map((i) => i.path.replace(/^reactions\./, "")))];
  const repairText = await client({ system, user: repairPrompt(missingIds, solved), key: `${spec.id}.repair${round}` });
  const merged = mergeRepair(model, missingIds, repairText);
  if (merged === null) return null;
  return evaluate(core, spec, solved, skeleton, merged);
}
