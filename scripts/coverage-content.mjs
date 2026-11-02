import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CONTENT_TARGET, isContentStatus } from "../packages/core/.validate-dist/index.js";

export { CONTENT_TARGET };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LESSON_DIRS = ["lessons", "content"];
const REPORT_PATH = path.join("evidence", "U17", "coverage.md");

export function templateKey(problem) {
  if (problem.compare) return `compare:${problem.compare.relation}`;
  const unknown = problem.unknown ?? "result";
  const steps = Array.isArray(problem.steps) && problem.steps.length > 0
    ? problem.steps.map((step) => step.kind).join(",")
    : "none";
  return `${unknown}:${steps}`;
}

export function sizeBand(story) {
  const totals = story.solved?.totals;
  const largest = Array.isArray(totals) && totals.length > 0
    ? Math.max(...totals)
    : story.solved?.answer;
  if (typeof largest !== "number") return null;
  if (largest <= 20) return "within 20";
  if (largest <= 50) return "within 50";
  if (largest <= 100) return "within 100";
  return null;
}

function meetsTarget(counts) {
  return counts.templates >= CONTENT_TARGET.templates
    && counts.contexts >= CONTENT_TARGET.contexts
    && counts.ladderSteps >= CONTENT_TARGET.ladderSteps
    && counts.instances >= CONTENT_TARGET.instances;
}

export function computeCoverage(lessons) {
  const byStandard = new Map();
  const bucketFor = (standard) => {
    if (!byStandard.has(standard)) {
      byStandard.set(standard, {
        templates: new Set(),
        contexts: new Set(),
        ladderSteps: new Set(),
        instances: new Set(),
        approved: 0,
      });
    }
    return byStandard.get(standard);
  };

  for (const lesson of lessons) {
    const stories = Array.isArray(lesson?.stories)
      ? lesson.stories
      : lesson?.solved
        ? [lesson]
        : [];
    const approvedLesson = isContentStatus(lesson?.status) && lesson.status === "approved";
    for (const story of stories) {
      const problem = story?.solved?.problem;
      if (!problem || typeof problem.standard !== "string") continue;
      const bucket = bucketFor(problem.standard);
      bucket.templates.add(templateKey(problem));
      if (typeof problem.item === "string") bucket.contexts.add(problem.item);
      const band = sizeBand(story);
      if (band) bucket.ladderSteps.add(band);
      bucket.instances.add(typeof problem.id === "string" ? problem.id : JSON.stringify(problem));
      if (approvedLesson) bucket.approved += 1;
    }
  }

  return [...byStandard.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([standard, bucket]) => {
      const row = {
        standard,
        templates: bucket.templates.size,
        contexts: bucket.contexts.size,
        ladderSteps: bucket.ladderSteps.size,
        instances: bucket.instances.size,
        approved: bucket.approved,
        meetsTarget: false,
      };
      row.meetsTarget = meetsTarget(row);
      return row;
    });
}

export function exitCodeForRows(rows) {
  return rows.some((row) => row.approved > 0 && !row.meetsTarget) ? 1 : 0;
}

export function formatTable(rows) {
  const headers = ["standard", "templates", "contexts", "ladderSteps", "instances", "approved", "meetsTarget"];
  const lines = rows.map((row) => headers.map((header) => String(row[header])));
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...lines.map((line) => line[index].length)));
  const render = (cells) => cells.map((cell, index) => cell.padEnd(widths[index])).join("  ").trimEnd();
  return [render(headers), ...lines.map(render)].join("\n");
}

export function formatReport(rows) {
  const summary = JSON.stringify({ target: CONTENT_TARGET, rows }, null, 2);
  return [
    "# U17 content coverage",
    "",
    "```text",
    formatTable(rows),
    "```",
    "",
    "```json",
    summary,
    "```",
    "",
  ].join("\n");
}

async function walkJson(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkJson(full, out);
    else if (entry.isFile() && entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

export async function readLessons(root = ROOT) {
  const lessons = [];
  for (const dir of LESSON_DIRS) {
    for (const file of await walkJson(path.join(root, dir))) {
      lessons.push(JSON.parse(await fs.readFile(file, "utf8")));
    }
  }
  return lessons;
}

export async function main(root = ROOT) {
  const rows = computeCoverage(await readLessons(root));
  console.log(formatTable(rows));
  console.log(JSON.stringify({ target: CONTENT_TARGET, rows }, null, 2));
  const reportPath = path.join(root, REPORT_PATH);
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, formatReport(rows));
  return exitCodeForRows(rows);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
