// U15 generator eval: 20 specs across NC.2.OA.1 and NC.2.NBT.5 through
// the gateway. Reports first-pass rate, after-retry rate, human slots and
// a reading-level distribution. Writes evidence/U15/eval.md.
// Live run needs GEN_GATEWAY_URL + GEN_GATEWAY_KEY (see gen/config.mjs).

import { execSync } from "node:child_process";
import { promises as fs, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SPECS_DIR = path.join(ROOT, "gen/eval/specs");
const EVAL_MD = path.join(ROOT, "evidence/U15/eval.md");
const DRAFTS_DIR = path.join(ROOT, "evidence/U15/drafts");

const log = (...a) => console.error("[eval:gen]", ...a);

function buildCore() {
  execSync("pnpm --filter @kids-math/core exec tsc -p tsconfig.cli.json", { cwd: ROOT, stdio: "pipe" });
}

/** Flesch-Kincaid grade, eval estimate only (not a validator gate). */
export function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/[^aeiouy]+/g, " ").trim().split(/\s+/).length;
  const silentE = w.endsWith("e") && groups > 1 ? 1 : 0;
  return Math.max(1, groups - silentE);
}
export function fkGrade(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const sentences = Math.max(1, text.split(/[.!?]+/).filter((s) => s.trim()).length);
  const syl = words.reduce((a, w) => a + countSyllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}

/** Every child-facing line of a story, filled with solver-derived numbers. */
export function storyLines(core, story) {
  const out = [];
  const extra = { shown: story.solved.answer };
  for (const q of story.questions) {
    out.push(q.ask, q.hints[0], q.hints[1], q.hints[2].exampleSay, q.hints[2].say, ...q.explainChoices);
  }
  for (const r of story.reactions) out.push(r.pip);
  return out.map((t) => core.fill(t, story.solved, extra));
}

const bucket = (g) => (g <= 1 ? "<=1" : g <= 2 ? "1-2" : g <= 3 ? "2-3" : ">3");

async function main() {
  buildCore();
  const core = await import("../packages/core/.validate-dist/index.js");
  const { loadSpec } = await import("./spec.mjs");
  const { generateDraft } = await import("./draft.mjs");
  const { buildClient } = await import("./llm.mjs");
  const { config } = await import("./config.mjs");

  const files = (await fs.readdir(SPECS_DIR)).filter((f) => f.endsWith(".spec.json")).sort();
  if (!files.length) throw new Error("no specs in gen/eval/specs");
  const model = process.env.GEN_MODEL ?? config.model;
  log(`${files.length} specs, model ${model}`);
  const rawClient = buildClient({ model, maxTokens: config.maxTokens, temperature: config.temperature });

  const rows = [];
  const grades = [];
  let gatewayBlocked = null;
  for (const f of files) {
    const spec = loadSpec(JSON.parse(readFileSync(path.join(SPECS_DIR, f), "utf8")));
    let calls = 0;
    const client = async (req) => { calls++; return rawClient(req); };
    try {
      const r = await generateDraft(core, spec, client);
      const firstPass = r.status === "validated" && calls === 1;
      rows.push({
        id: spec.id, standard: spec.standard, firstPass,
        final: r.status, slots: r.slots.length,
        codes: [...new Set(r.issues.map((i) => i.code))].join("+") || "-",
      });
      if (r.status === "validated") {
        const out = path.join(ROOT, "gen/out/eval", `${spec.id}.draft.json`);
        mkdirSync(path.dirname(out), { recursive: true });
        await fs.writeFile(out, JSON.stringify(r, null, 2) + "\n");
        for (const line of storyLines(core, r.story)) grades.push(fkGrade(line));
      } else {
        const out = path.join(ROOT, "gen/out/eval", `${spec.id}.slots.json`);
        mkdirSync(path.dirname(out), { recursive: true });
        await fs.writeFile(out, JSON.stringify(r, null, 2) + "\n");
      }
    } catch (e) {
      if (/missing-gateway|gateway-error|missing-cache/.test(e.message)) { gatewayBlocked = e.message; break; }
      rows.push({ id: spec.id, standard: spec.standard, firstPass: false, final: "error", slots: 0, codes: "error" });
      log(`${spec.id}: ${e.message}`);
    }
  }

  mkdirSync(path.dirname(EVAL_MD), { recursive: true });
  if (gatewayBlocked && !rows.some((r) => r.final !== "error")) {
    await fs.writeFile(EVAL_MD, [
      "# U15 evidence — generator eval",
      "",
      `Status: live run blocked (${gatewayBlocked}).`,
      `Specs ready: ${files.length} across NC.2.OA.1 and NC.2.NBT.5 (see gen/eval/specs/).`,
      "Set GEN_GATEWAY_URL and GEN_GATEWAY_KEY, then re-run `npm run eval:gen`.",
      "Review rubric: gen/eval/rubric.md.",
      "",
    ].join("\n"));
    console.log(JSON.stringify({ status: "blocked", reason: gatewayBlocked, specs: files.length }));
    process.exit(1);
  }

  const validated = rows.filter((r) => r.final === "validated");
  const firstPass = rows.filter((r) => r.firstPass);
  const buckets = {};
  for (const g of grades) buckets[bucket(g)] = (buckets[bucket(g)] ?? 0) + 1;
  const mean = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
  const worst = [...rows].sort((a, b) => b.slots - a.slots).slice(0, 3);
  const review = validated.slice(0, 5);

  mkdirSync(DRAFTS_DIR, { recursive: true });
  for (const r of [...worst.filter((w) => w.final !== "validated"), ...review]) {
    const src = path.join(ROOT, "gen/out/eval",
      r.final === "validated" ? `${r.id}.draft.json` : `${r.id}.slots.json`);
    try {
      await fs.copyFile(src, path.join(DRAFTS_DIR, `${r.id}.${r.final === "validated" ? "draft" : "slots"}.json`));
    } catch { /* row without a file (error) */ }
  }

  const codeHist = {};
  for (const r of rows) for (const c of r.codes.split("+")) codeHist[c] = (codeHist[c] ?? 0) + 1;

  const table = ["| spec | standard | first pass | final | slots | codes |",
    "|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.id} | ${r.standard} | ${r.firstPass ? "yes" : "no"} | ${r.final} | ${r.slots} | ${r.codes} |`)];
  await fs.writeFile(EVAL_MD, [
    "# U15 evidence — generator eval",
    "",
    `Model: ${model}. Specs: ${rows.length}.`,
    "",
    "## Rates",
    "",
    `- First-pass validated: ${firstPass.length}/${rows.length}.`,
    `- Validated after retry: ${validated.length}/${rows.length}.`,
    `- Human slots total: ${rows.reduce((a, r) => a + r.slots, 0)}.`,
    `- Issue codes: ${Object.entries(codeHist).map(([c, n]) => `${c} x${n}`).join(", ") || "none"}.`,
    "",
    "## Table",
    "",
    ...table,
    "",
    "## Reading level (Flesch-Kincaid estimate over filled lines of validated drafts)",
    "",
    `- Lines measured: ${grades.length}. Mean grade: ${mean.toFixed(1)}.`,
    `- Distribution: ${Object.entries(buckets).map(([b, n]) => `${b}: ${n}`).join(", ") || "none"}.`,
    "",
    "## Worst 3 (by slot count)",
    "",
    ...worst.map((r) => `- ${r.id} (${r.final}, ${r.slots} slots): ${r.codes}. File: evidence/U15/drafts/${r.id}.${r.final === "validated" ? "draft" : "slots"}.json`),
    "",
    "## Review gate (Anantha, rubric gen/eval/rubric.md)",
    "",
    ...review.map((r) => `- [ ] ${r.id}: evidence/U15/drafts/${r.id}.draft.json`),
    ...(review.length < 5 ? ["", `Only ${review.length} validated drafts available for review.`] : []),
    "",
  ].join("\n"));
  console.log(JSON.stringify({
    status: "ok", specs: rows.length,
    firstPass: `${firstPass.length}/${rows.length}`,
    validated: `${validated.length}/${rows.length}`,
    review: review.map((r) => r.id),
  }));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((e) => { console.error(`[eval:gen] fatal: ${e.message}`); process.exit(1); });
}
