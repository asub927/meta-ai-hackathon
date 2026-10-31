// S0 gap checklist: every corroboration gap as a runnable assertion.
// Failing now by design. S9 passes when this is green.
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const results = [];

const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });
const read = (p) => fs.readFile(path.join(ROOT, p), "utf8").catch(() => null);
const exists = async (p) => { try { await fs.stat(path.join(ROOT, p)); return true; } catch { return false; } };

async function walk(dir, out = []) {
  for (const e of await fs.readdir(path.join(ROOT, dir), { withFileTypes: true }).catch(() => [])) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) await walk(rel, out);
    else out.push(rel);
  }
  return out;
}

// A. Storage (PLAN.md:86-87 forbids localStorage, mandates idb plus persist).
{
  const files = (await walk("apps/web/src")).filter((f) => !f.includes("/e2e/") && !f.endsWith(".test.ts"));
  const hits = [];
  for (const f of files) {
    if (f === "apps/web/src/shell/storage.ts") continue;
    const text = await read(f);
    if (text && text.includes("localStorage")) hits.push(f);
  }
  const main = (await read("apps/web/src/main.tsx")) ?? "";
  const storage = (await read("apps/web/src/shell/storage.ts")) ?? "";
  const migrationOnce = storage.includes("localStorage")
    && storage.includes("migrateLegacyKeys")
    && main.includes("migrateLegacyKeys");
  check("legacy-storage-migration-once", hits.length === 0 && migrationOnce, hits.join(", ") || "storage.ts migration only");
  const pkg = JSON.parse((await read("apps/web/package.json")) ?? "{}");
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  check("idb-dependency", "idb" in deps, Object.keys(deps).join(", "));
  check("persist-result-shown", /navigator\.storage[\s\S]*?persist\(\)/.test(storage), "navigator.storage.persist()");
  check("home-screen-prompt", /home screen/i.test(main), "Add to Home Screen");
}

// B. Log integrity.
{
  const log = (await read("apps/web/src/log/eventLog.ts")) ?? "";
  check("import-compares-checksum", /mismatch/i.test(log), "reject mismatched files");
  const types = (await read("packages/core/src/types.ts")) ?? "";
  const recordLine = types.split("\n").find((l) => l.includes('"record"')) ?? "";
  check("record-effect-carries-payload", /clean|template/.test(recordLine), recordLine.trim());
}

// C. Smaller question (PLAN.md:200-201, :410).
{
  const types = (await read("packages/core/src/types.ts")) ?? "";
  check("reaction-has-smaller", /smaller:\s*Question/.test(types), "ReactionScript.smaller");
  const step = ((await read("packages/core/src/step.ts")) ?? "").replace(/\/\/.*/g, "");
  check("reacting-returns-smaller", step.includes("smaller"), "step.ts reacting case");
}

// D. Audio and speech.
{
  const audio = (await read("apps/web/src/audio/audio.ts")) ?? "";
  check("music-ducking", /gain|duck/i.test(audio), "GainNode ducking");
  const sw = (await read("apps/web/public/sw.js")) ?? "";
  check("audio-precached", /mp3|wav|ogg|audio/i.test(sw), "sw precache list or exemption note");
  const speech = ((await read("apps/web/src/speech/speech.ts")) ?? "")
    + ((await read("apps/web/src/main.tsx")) ?? "");
  check("word-highlighting", /onboundary/i.test(speech), "boundary events");
  const main = (await read("apps/web/src/main.tsx")) ?? "";
  check("voice-logging", /voiceLog|VoiceLog|createVoiceLog/.test(main), "VoiceLog wiring in main");
}

// E. Verify scripts.
{
  const pkg = JSON.parse((await read("apps/web/package.json")) ?? "{}");
  for (const s of ["verify:fps", "verify:seek", "verify:interact", "verify:audio"])
    check(`script-${s}`, s in (pkg.scripts ?? {}), s);
  check("docs-verify-map", await exists("docs/verify-map.md"), "docs/verify-map.md");
}

// F. Evidence.
{
  for (const u of ["U5", "U6", "U7", "U8", "U9", "U10", "U11"])
    check(`evidence-${u}`, await exists(`evidence/${u}/report.md`), `evidence/${u}/report.md`);
  check("evidence-U12-paths", await exists("evidence/U12/paths-report.md"), "paths-report.md");
  check("evidence-U0-beats", await exists("evidence/U0/beats.json"), "beats.json");
  const specs = (await fs.readdir(path.join(ROOT, "gen/eval/specs")).catch(() => []))
    .filter((f) => f.endsWith(".spec.json")).length;
  const drafts = (await fs.readdir(path.join(ROOT, "evidence/U15/drafts")).catch(() => []))
    .filter((f) => f.endsWith(".draft.json")).length;
  check("u15-all-drafts-saved", specs > 0 && drafts >= specs, `${drafts}/${specs} drafts`);
  const evalMd = (await read("evidence/U15/eval.md")) ?? "";
  check("u15-reviews-checked", !/- \[ \]/.test(evalMd), "unchecked boxes");
  check("u4-report-fresh", !/45\/45/.test((await read("evidence/U4/README.md")) ?? ""), "45/45 claim");
  check("u14-report-fresh", !/[^0-9]9 passed/.test((await read("evidence/U14/report.md")) ?? ""), "9 passed claim");
  const kidflow = (await read("evidence/U12/kid-flow-findings.md")) ?? "";
  check("run1-ref-resolved", !kidflow.includes("run1.mp4") || await exists("render/out/run1.mp4"), "run1.mp4");
}

// G. Governance and U15a.
{
  const log = (await read("docs/DECISIONS-LOG.md")) ?? "";
  check("u2-retirement-recorded", /retire/i.test(log) && /\bU2\b/.test(log), "retire U1/U2/U2b/U2c");
  const srcFiles = await walk("apps/web/src");
  let authorHit = false;
  for (const f of srcFiles) {
    if (/author/i.test(f)) { authorHit = true; break; }
    const text = await read(f);
    if (text && /authoring/i.test(text)) { authorHit = true; break; }
  }
  check("u15a-authoring-page", authorHit, "authoring route");
  check("u15a-authored-file", await exists("evidence/U15a/authored-lesson.json"), "authored file");
  const lesson1 = (await read("apps/web/e2e/lesson1.spec.ts")) ?? "";
  const listeners = (lesson1.match(/page\.on\(["']console["']/g) ?? []).length;
  check("lesson1-console-listeners", listeners >= 3, `${listeners}/3 tests`);
}

let fails = 0;
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name}${r.ok || !r.detail ? "" : `: ${r.detail}`}`);
  if (!r.ok) fails++;
}
console.log(`${results.length - fails}/${results.length} checks pass`);
process.exit(fails ? 1 : 0);
