// U14 spec: the input side of the generator. A spec names the cast, the
// source record, and the problem either as structured params (code derives
// every number) or as a word problem the model parses (code re-derives and
// re-validates everything after). The question skeleton is derived by code
// too: one predict per step, then one final count. The model only ever
// writes LineTemplates.

/** Load and shape-check a spec file. Throws on a bad spec. */
export function loadSpec(json) {
  if (json === null || typeof json !== "object" || Array.isArray(json))
    throw new Error("invalid-spec: spec must be an object");
  for (const k of ["id", "standard", "hero", "item", "problem", "source"]) {
    if (json[k] === undefined) throw new Error(`invalid-spec: missing "${k}"`);
  }
  if (!/^NC\.\d/.test(json.standard)) throw new Error("invalid-spec: standard must be an NCDPI id");
  const source = json.source;
  if (!source || typeof source.url !== "string" || typeof source.licence !== "string" || typeof source.changes !== "string")
    throw new Error("invalid-spec: source needs url, licence and changes strings");
  return {
    id: json.id, standard: json.standard,
    hero: json.hero, friend: json.friend ?? null, item: json.item,
    source: { url: source.url, licence: source.licence, changes: source.changes },
    problem: json.problem,
  };
}

/** Structured problem params -> Problem. The 0 placeholders mirror lesson 1:
 *  start-unknown stores start 0 with the known `result`; change-unknown
 *  stores a 0 `n` on its single step. solve() derives the rest. */
export function problemFromSpec(spec) {
  const p = spec.problem;
  if (p.words !== undefined) throw new Error("words-problem: parse through the model first");
  const base = {
    id: spec.id, standard: spec.standard,
    hero: spec.hero, friend: spec.friend, item: spec.item,
  };
  if (p.compare) {
    const c = p.compare;
    return {
      ...base, start: 0, steps: [],
      compare: { relation: c.relation, reference: c.reference, difference: c.difference, ...(c.heroCount !== undefined ? { heroCount: c.heroCount } : {}) },
    };
  }
  if (!Array.isArray(p.steps)) throw new Error("invalid-spec: problem needs steps or compare");
  const unknown = p.unknown ?? "result";
  if (unknown === "start") {
    if (p.result === undefined) throw new Error("invalid-spec: start-unknown needs result");
    return { ...base, start: 0, unknown: "start", result: p.result, steps: p.steps };
  }
  if (p.start === undefined) throw new Error("invalid-spec: problem needs start");
  if (unknown === "change") {
    if (p.result === undefined) throw new Error("invalid-spec: change-unknown needs result");
    return { ...base, start: p.start, unknown: "change", result: p.result, steps: p.steps };
  }
  return { ...base, start: p.start, steps: p.steps };
}

/** Deterministic question skeleton for a solved problem. */
export function skeletonFor(solved, specId) {
  const out = [];
  solved.problem.steps.forEach((_, i) => {
    out.push({ id: `${specId}-q${i}-predict`, step: i, interaction: "predict" });
  });
  out.push({ id: `${specId}-qfinal-count`, step: "final", interaction: "count" });
  return out;
}

/** Misconception ids the model must write one pip each for. Fixed by the registry. */
export const REACTION_IDS = [
  "wrong-operation", "echoed-a-given", "smaller-from-larger",
  "direction-flip", "off-by-one", "unknown",
];
