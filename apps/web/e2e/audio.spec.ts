import { expect, test } from "@playwright/test";

// Assumption: in WebKit (headed or headful Chromium/Firefox too) the Start
// button click counts as a user gesture, so AudioContext resumes to
// "running". Headless runs with a strict autoplay policy may report
// "suspended" instead; the assertions below target "running" per PLAN U10.

test("audio: Start unlocks to running and survives visibility toggle", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).audioState()))
    .toBe("running");

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await page.evaluate(() => (window as any).audioState())).toBe("running");
});

test("audio: playing a beat records cues", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: /Lesson 1/ }).click();
  // Answer through the first beat: predict + explain.
  await page.getByRole("button", { name: "fewer" }).click();
  await page.getByRole("button", { name: /counted|Giving|tens/i }).first().click();
  const cues = await page.evaluate(() => (window as any).__cueLog?.());
  expect(Array.isArray(cues)).toBe(true);
  expect(cues.length).toBeGreaterThan(0);
});
