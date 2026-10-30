// U13 deterministic renderer CLI.
//   node render/render.mjs <lesson.json> --path wrong-then-right [--out file] [--frames-dir dir]
//   node render/render.mjs <lesson.json> --path wrong-then-right --verify-cues <mp4>
//
// Frame-stepped deterministic capture only (no real-time screencast): replays
// the scripted UI actions, then for every 30 fps frame calls
// window.__render.seek(tSeconds) and screenshots into ffmpeg stdin (image2pipe,
// libx264, yuv420p, 30 fps, bitexact flags) + a synthesized WAV of cue blips
// encoded AAC. Prints one JSON report line:
//   {out, frames, durationMs, videoStreamHash}

import { spawn, execFileSync, execSync } from "node:child_process";
import { createRequire } from "node:module";
import { promises as fs, readFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;
const PORTS = [5199, 5200, 5201, 5202, 5203];

const log = (...a) => console.error("[render]", ...a);

function parseArgs(argv) {
  const args = { lesson: null, path: "wrong-then-right", out: null, framesDir: null, verifyCues: null };
  const rest = [...argv];
  if (rest.length && !rest[0].startsWith("--")) args.lesson = rest.shift();
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--path") args.path = rest[++i];
    else if (a === "--out") args.out = rest[++i];
    else if (a === "--frames-dir") args.framesDir = rest[++i];
    else if (a === "--verify-cues") args.verifyCues = rest[++i];
    else throw new Error(`unknown arg: ${a}`);
  }
  if (!args.lesson) throw new Error("usage: render.mjs <lesson.json> --path wrong-then-right [--out f] [--frames-dir d] [--verify-cues mp4]");
  return args;
}

/** Compile core first (existing pattern): produces packages/core/.validate-dist. */
function buildCore() {
  log("building core…");
  execSync("pnpm --filter @kids-math/core exec tsc -p tsconfig.cli.json", { cwd: ROOT, stdio: "pipe" });
}

function framesFor(durationMs) {
  return Math.round((durationMs * FPS) / 1000);
}

// ---------- --verify-cues mode ----------

async function verifyCuesMode(lessonJson, pathName, mp4) {
  buildCore();
  const { buildTimeline } = await import("./timeline.mjs");
  const { detectOnsets, SAMPLE_RATE } = await import("./audio.mjs");
  const tl = buildTimeline(lessonJson, pathName);
  const expected = tl.cues.map((c) => c.atMs);
  log(`decoding audio from ${mp4} (${expected.length} expected cues)…`);
  const raw = execFileSync("ffmpeg", [
    "-v", "error", "-i", mp4, "-map", "0:a", "-c:a", "pcm_f32le",
    "-f", "f32le", "-ac", "1", "-ar", String(SAMPLE_RATE), "-",
  ], { maxBuffer: 256 * 1024 * 1024 });
  const floats = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 4));
  const detected = detectOnsets(floats, SAMPLE_RATE);
  let maxErrorMs = 0;
  const unmatched = [];
  for (const e of expected) {
    let best = Infinity;
    for (const d of detected) best = Math.min(best, Math.abs(d - e));
    if (!Number.isFinite(best)) unmatched.push(e);
    else maxErrorMs = Math.max(maxErrorMs, best);
  }
  const ok = unmatched.length === 0 && maxErrorMs <= 1000 / FPS + 1e-9 && detected.length === expected.length;
  console.log(JSON.stringify({
    mp4, expectedCues: expected.length, detectedCues: detected.length,
    maxErrorMs: Math.round(maxErrorMs * 100) / 100, ok,
  }));
  if (!ok) {
    log(`expected: ${expected.map((e) => Math.round(e)).join(",")}`);
    log(`detected: ${detected.map((d) => Math.round(d)).join(",")}`);
    process.exit(1);
  }
}

// ---------- render mode ----------

// Harness-only determinism: freeze WAAPI, kill CSS animations/transitions,
// hide the wall-clock Hint button (the path never uses hints). App code untouched.
function harnessInit({ stories }) {
  window.__lessonOverride = stories;
  try {
    Element.prototype.animate = function () {
      return { cancel() {}, play() {}, pause() {}, reverse() {}, commitStyles() {}, persist() {}, finished: Promise.resolve() };
    };
    const css = document.createElement("style");
    css.textContent = "*{animation:none!important;transition:none!important;caret-color:transparent!important}html{scrollbar-width:none}::-webkit-scrollbar{display:none!important}";
    document.documentElement.appendChild(css);
    const hideHint = (root) => {
      if (!root || !root.querySelectorAll) return;
      for (const b of root.querySelectorAll("button")) {
        try { if (b.textContent.trim() === "Hint") b.style.display = "none"; } catch {}
      }
    };
    new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) { if (n instanceof Element) hideHint(n); }
    }).observe(document.documentElement, { childList: true, subtree: true });
    hideHint(document);
  } catch {}
}

async function startPreview() {
  for (const port of PORTS) {
    const proc = spawn("pnpm", ["--filter", "web", "exec", "vite", "preview",
      "--port", String(port), "--strictPort", "--host", "127.0.0.1"],
      { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    proc.stdout.resume();
    proc.stderr.resume();
    const url = `http://127.0.0.1:${port}/`;
    const deadline = Date.now() + 30000;
    let ready = false;
    while (Date.now() < deadline) {
      if (proc.exitCode !== null && proc.exitCode !== undefined) break; // port taken / failed
      try {
        const res = await fetch(url);
        if (res.ok) { ready = true; break; }
      } catch { /* not up yet */ }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (ready) { log(`preview on ${url}`); return { proc, url }; }
    proc.kill("SIGKILL");
  }
  throw new Error(`vite preview would not start on ports ${PORTS.join(",")}`);
}

function writeStdin(proc, buf) {
  return new Promise((resolve, reject) => {
    const onErr = (e) => reject(e);
    proc.stdin.once("error", onErr);
    if (!proc.stdin.write(buf)) proc.stdin.once("drain", () => {
      proc.stdin.removeListener("error", onErr);
      resolve();
    });
    else {
      proc.stdin.removeListener("error", onErr);
      resolve();
    }
  });
}

async function perform(page, action) {
  if (action.type === "predict") {
    await page.getByRole("button", { name: action.value, exact: true }).click();
  } else if (action.type === "count") {
    await page.getByTestId("count-input").fill(String(action.value));
    await page.getByRole("button", { name: "Answer" }).click();
  } else if (action.type === "keep-going") {
    await page.getByRole("button", { name: "Keep going" }).click();
  } else if (action.type === "explain-first") {
    await page.locator("button.secondary:visible").first().click();
  } else if (action.type === "next-story") {
    await page.getByTestId("next-story").click();
  } else {
    throw new Error(`unknown action: ${action.type}`);
  }
}

/** Wait until the app is in the state the segment depicts. */
async function waitForSegment(page, seg) {
  if (seg.kind === "beat" && seg.script.id.startsWith("beat:")) {
    await page.locator('button.predict, [data-testid="count-input"]').first().waitFor({ timeout: 15000 });
  } else if (seg.kind === "beat") {
    await page.getByRole("button", { name: "Keep going" }).waitFor({ timeout: 15000 });
  } else if (seg.holdKind === "explaining") {
    await page.getByText("How did you know?").first().waitFor({ timeout: 15000 });
  } else {
    await page.locator('[data-testid="next-story"], [data-testid="lesson1-done"], [data-testid="done"]').first().waitFor({ timeout: 15000 });
  }
}

async function renderMode(lessonFile, lessonJson, args) {
  const { buildTimeline } = await import("./timeline.mjs");
  const { synthCuesWav } = await import("./audio.mjs");
  const tl = buildTimeline(lessonJson, args.path);
  const totalFrames = tl.segments.reduce((a, s) => a + framesFor(s.durationMs), 0);
  log(`timeline: ${tl.segments.length} segments, ${tl.actions.length} actions, ${tl.cues.length} cues, ${tl.totalMs}ms, ${totalFrames} frames`);

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "u13-render-"));
  const wavPath = path.join(tmp, "cues.wav");
  await fs.writeFile(wavPath, synthCuesWav(tl.cues, tl.totalMs));

  const outDefault = path.join(ROOT, "render/out",
    `${path.basename(args.lesson, path.extname(args.lesson))}-${args.path}.mp4`);
  const out = args.out ? path.resolve(args.out) : outDefault;
  mkdirSync(path.dirname(out), { recursive: true });
  if (args.framesDir) mkdirSync(path.resolve(args.framesDir), { recursive: true });

  log("building web…");
  execSync("pnpm --filter web build", { cwd: ROOT, stdio: "pipe" });
  const { proc: server, url } = await startPreview();

  const require = createRequire(path.join(ROOT, "apps/web/package.json"));
  const { chromium } = require("@playwright/test");

  const ff = spawn("ffmpeg", [
    "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-i", wavPath,
    "-map", "0:v", "-map", "1:a",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "1",
    "-fflags", "+bitexact", "-flags:v", "+bitexact", "-flags:a", "+bitexact",
    "-map_metadata", "-1", "-threads", "1", "-shortest", out,
  ], { stdio: ["pipe", "ignore", "pipe"] });
  const ffErr = [];
  ff.stderr.on("data", (d) => ffErr.push(d));
  const ffDone = new Promise((resolve, reject) => {
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
    ff.on("error", reject);
  });

  let browser = null;
  let ok = false;
  try {
    browser = await chromium.launch();
    const ctx = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: "no-preference",
    });
    await ctx.addInitScript(harnessInit, { stories: lessonFile.stories });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByTestId("lesson1-button").click();

    let frame = 0;
    for (const seg of tl.segments) {
      for (const a of seg.actions) await perform(page, a);
      await waitForSegment(page, seg);
      const n = framesFor(seg.durationMs);
      const isBeat = seg.kind === "beat";
      for (let i = 0; i < n; i++) {
        if (isBeat) await page.evaluate((s) => window.__render.seek(s), i / FPS);
        const png = await page.screenshot();
        if (png[1] !== 0x50 || png[2] !== 0x4e || png[3] !== 0x47) throw new Error(`frame ${frame}: not a PNG`);
        if (args.framesDir) {
          await fs.writeFile(
            path.join(path.resolve(args.framesDir), `frame-${String(frame).padStart(5, "0")}.png`), png);
        }
        await writeStdin(ff, png);
        frame++;
      }
    }
    await browser.close();
    browser = null;
    ff.stdin.end();
    await ffDone;
    ok = true;
    const hashOut = execFileSync("ffmpeg", ["-v", "error", "-i", out, "-map", "0:v", "-c", "copy",
      "-f", "streamhash", "-hash", "sha256", "-"], { encoding: "utf8" });
    const m = hashOut.match(/[0-9a-f]{64}/);
    if (!m) throw new Error(`could not parse streamhash: ${hashOut}`);
    console.log(JSON.stringify({ out, frames: totalFrames, durationMs: tl.totalMs, videoStreamHash: m[0] }));
  } finally {
    if (browser) await browser.close().catch(() => {});
    try { server.kill("SIGKILL"); } catch { /* already dead */ }
    if (ok) {
      await fs.rm(tmp, { recursive: true, force: true });
    } else {
      await fs.writeFile(path.join(tmp, "ffmpeg.log"), Buffer.concat(ffErr));
      log(`kept temp dir (failure): ${tmp}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const lessonJson = JSON.parse(readFileSync(path.resolve(args.lesson), "utf8"));
  if (args.verifyCues) {
    await verifyCuesMode(lessonJson, args.path, path.resolve(args.verifyCues));
    return;
  }
  // renderMode rebuilds core, validates the lesson, and derives the
  // __lessonOverride stories from the validated file.
  buildCore();
  const { loadLessonFile } = await import("./timeline.mjs");
  const lessonFile = loadLessonFile(lessonJson);
  await renderMode(lessonFile, lessonJson, args);
}

main().catch((e) => { console.error(`[render] fatal: ${e.message}`); process.exit(1); });
