#!/usr/bin/env node
// fps gate for PLAN.md:388 (U3): 59 fps or better at 4x CPU throttle with
// 6 or fewer frames over 20 ms. Boots the app's own dev server, drives
// headless Chromium through the Start tap into lesson 1, then samples
// requestAnimationFrame deltas under Emulation.setCPUThrottlingRate(4x).
// Stdout is exactly two `metric value rule verdict` lines; all else is stderr.
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const FPS_MIN = 59;
const OVER_MAX = 6;
const FRAMES = 240;
const THROTTLE = 4;
const PORT = Number(process.env.PORT ?? process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ?? 5179);
const APP_DIR = new URL("..", import.meta.url).pathname;
const BASE = `http://127.0.0.1:${PORT}`;

const log = (...a) => console.error(...a);

const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--port", String(PORT), "--host", "127.0.0.1"], {
  cwd: APP_DIR, stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (d) => log(String(d).trimEnd()));
server.stderr.on("data", (d) => log(String(d).trimEnd()));
const kill = () => { server.kill("SIGTERM"); };
process.on("exit", kill);
process.on("SIGINT", () => { kill(); process.exit(130); });

for (let i = 0; i < 120; i++) {
  try {
    const r = await fetch(BASE, { signal: AbortSignal.timeout(1000) });
    if (r.ok) break;
  } catch { /* not up yet */ }
  await sleep(500);
  if (server.exitCode !== null) {
    log(`dev server exited early with code ${server.exitCode}`);
    process.exit(1);
  }
}

let outcome = 1;
try {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    await page.goto(BASE);
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByTestId("lesson1-button").click();
    const stamps = await page.evaluate((n) => new Promise((resolve) => {
      const ts = [];
      const drain = (t) => { ts.push(t); if (ts.length < n) requestAnimationFrame(drain); else resolve(ts); };
      requestAnimationFrame(drain);
    }), FRAMES);
    const elapsed = (stamps[stamps.length - 1] - stamps[0]) / 1000;
    const fps = (stamps.length - 1) / elapsed;
    const over = stamps.slice(1).filter((t, i) => t - stamps[i] > 20).length;
    const fpsVerdict = fps >= FPS_MIN ? "pass" : "fail";
    const overVerdict = over <= OVER_MAX ? "pass" : "fail";
    console.log(`fps ${fps.toFixed(2)} >=${FPS_MIN} ${fpsVerdict}`);
    console.log(`frames-over-20ms ${over} <=${OVER_MAX} ${overVerdict}`);
    outcome = fpsVerdict === "pass" && overVerdict === "pass" ? 0 : 1;
  } finally {
    await browser.close();
  }
} finally {
  kill();
}
process.exit(outcome);
