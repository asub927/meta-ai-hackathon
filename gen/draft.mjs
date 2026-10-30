// U14 draft assembly: prompt -> model JSON -> StoryData -> validate ->
// one retry -> validated or human slots. Code owns every number: solved
// comes from solve(), never from the model. The model writes LineTemplates
// only, and any numeric field it returns is ignored, never read.

import { REACTION_IDS, problemFromSpec, skeletonFor } from "./spec.mjs";

const PLACEHOLDERS = "{hero} {item} {start} {answer} {result} {missing}";
const MAX_LINE = 30;

function forbiddenDigits(solved) {
  const p = solved.problem;
  const nums = new Set([
    ...solved.totals, solved.answer,
    ...(p.compare || p.unknown === "start" ? [] : [p.start]),
    ...p.steps.filter((s) => !(p.unknown === "change" && s.n === 0)).map((s) => s.n),
    ...(p.result !== undefined ? [p.result] : []),
    ...(p.compare ? [p.compare.reference, p.compare.difference] : []),
  ]);
  return [...nums].sort((a, b) => a - b).join(", ");
}

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
  return [
    "You write story lines for a Socratic math tutor. The tutor never states the answer.",
    "It asks one short question, the child acts, the story reacts. A wrong answer is",
    "never marked wrong: no red X, no wrong, no incorrect, no try again, no saying no.",
    "",
    "RULES FOR EVERY LINE YOU WRITE:",
    `- Placeholders only, from this list: ${PLACEHOLDERS}. Reactions may also use {shown}.`,
    "- Never write a digit 0-9 in any line, except the worked-example numbers (below).",
    "- Never write a number word (one, two, three, ... twenty).",
    `- Keep every line under ${MAX_LINE} characters; the app rejects bubbles over 45 after filling.`,
    "- Refer to the child-facing characters only with {hero} or they/them/their.",
    "  Never he, she, him, her, his, hers.",
    "- Ask exactly one thing per line. No compound questions.",
    "- Hints climb in this order: 1. a smaller question 2. a visual cue",
    "  (watch, point, make tens) 3. a worked mini-story with DIFFERENT numbers, then Now you try.",
    `- Worked mini-stories use a different item and small numbers. NEVER reuse these digits: ${forbiddenDigits(solved)}.`,
    "- Reaction lines comfort and redirect with {shown} where it fits.",
    "  They never contain the answer and never shame.",
    "",
    "OUTPUT: one JSON object only, no prose around it:",
    '{"lines": {"<questionId>": {"ask": "...", "hints": ["...", "...",',
    '  {"exampleSay": "...", "say": "Now you try."}],, "explainChoices": ["...", "..."]}, ...},',
    ' "reactions": {"<misconceptionId>": "...", ...}}',
    "Write every question id listed in the task, and all six reaction ids.",
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
    "ISSUES:",
    ...issues.map((i) => `- ${i.path} [${i.code}]: ${i.message}`),
    "YOUR LAST DRAFT:",
    previous,
  ].join("\n");
}

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
    if (!Array.isArray(l.hints) || typeof l.hints[0] !== "string" || typeof l.hints[1] !== "string" ||
      !l.hints[2] || typeof l.hints[2].exampleSay !== "string" || typeof l.hints[2].say !== "string")
      add("invalid-hint-ladder", `lines.${q.id}.hints`, "hints must be [string, string, {exampleSay, say}]");
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

function assembleStory(core, spec, solved, skeleton, model) {
  const questions = skeleton.map((q) => {
    const l = model.lines[q.id];
    return {
      id: q.id, step: q.step, ask: l.ask, interaction: q.interaction,
      hints: [l.hints[0], l.hints[1], { exampleSay: l.hints[2].exampleSay, say: l.hints[2].say }],
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
 *  the cached gateway. Attempts: initial + one retry with issues fed back. */
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

  let previous = null;
  let pending = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const key = `${spec.id}.attempt${attempt}`;
    const text = previous === null
      ? await client({ system, user, key })
      : await client({ system, user: retryPrompt(previous, pending), key });
    previous = text;
    let model = null;
    try { model = JSON.parse(text); } catch { model = null; }
    const shaped = shapeIssues(model, skeleton);
    if (shaped.length) {
      pending = shaped;
      if (attempt === 2) return { status: "needs-human", story: null, slots: shaped.map(toSlot), issues: shaped };
      continue;
    }
    const { story, issues } = assembleStory(core, spec, solved, skeleton, model);
    if (!issues.length && story) return { status: "validated", story, slots: [], issues: [] };
    pending = issues;
    if (attempt === 2) return { status: "needs-human", story: null, slots: issues.map(toSlot), issues };
  }
  throw new Error("unreachable: retry loop always returns");
}
