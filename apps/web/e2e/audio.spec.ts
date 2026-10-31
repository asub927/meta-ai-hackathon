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
  await page.getByRole("button", { name: /Stickers/ }).click();
  // Answer through the first beat: predict + explain.
  await page.getByRole("button", { name: "fewer" }).click();
  await page.getByRole("button", { name: /counted|Giving|tens/i }).first().click();
  const cues = await page.evaluate(() => (window as any).__cueLog?.());
  expect(Array.isArray(cues)).toBe(true);
  expect(cues.length).toBeGreaterThan(0);
});

test("speech: Read-aloud toggle hides when no local voice exists", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { getVoices: () => [], speak: () => {}, cancel: () => {} },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByText("Read-aloud")).toHaveCount(0);
});

test("speech: Read-aloud speaks Pip lines through the on-device voice only", async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: Array<{ text: string; voice: { localService: boolean } | null }> = [];
    (window as any).__spoken = spoken;
    const voices = [{ name: "OnDevice", localService: true, lang: "en-US" }];
    class FakeUtterance {
      text: string;
      voice: unknown = null;
      onboundary: unknown = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => voices,
        speak: (u: { text: string; voice: { localService: boolean } | null }) =>
          spoken.push({ text: u.text, voice: u.voice }),
        cancel: () => {},
      },
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: FakeUtterance });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByLabel("Read-aloud").check();
  await expect
    .poll(() => page.evaluate(() => (window as any).__spoken?.length ?? 0))
    .toBeGreaterThan(0);
  const spoken = await page.evaluate(() => (window as any).__spoken);
  expect(spoken[0].text.length).toBeGreaterThan(0);
  expect(spoken.every((s: { voice: { localService: boolean } | null }) => s.voice?.localService)).toBe(true);
});
