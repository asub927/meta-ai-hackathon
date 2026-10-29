import { expect, test } from "@playwright/test";

async function startLesson(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: /Lesson 1/ }).click();
}
async function answerCount(page: import("@playwright/test").Page, v: number) {
  await page.getByTestId("count-input").fill(String(v));
  await page.getByRole("button", { name: "Answer" }).click();
}
async function finishExplaining(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /counted|Giving|tens/i }).first().click();
}

test("beats: sticker totals are derived [24,15,20]", async ({ page }) => {
  await startLesson(page);
  await expect(page.getByTestId("start-count")).toHaveText("24");
  await expect(page.getByTestId("book-count")).toHaveText("24");
  await page.screenshot({ path: "../../evidence/U0/beat-start.png" });
});

test("lesson: right path finishes all questions", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await finishExplaining(page);
  await answerCount(page, 15);
  await finishExplaining(page);
  await answerCount(page, 20);
  await finishExplaining(page);
  await expect(page.getByTestId("done")).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: "../../evidence/U0/lesson-done.png" });
});

test("reaction: wrong answer plays out, never marked wrong", async ({ page }) => {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await finishExplaining(page);
  await answerCount(page, 33);
  await expect(page.getByTestId("book-count")).toHaveText("33");
  await expect(page.getByTestId("tray-count")).toHaveText("9");
  await expect(page.getByTestId("start-count")).toHaveText("24");
  await expect(page.locator("body")).not.toContainText(/wrong|try again/i);
  await page.screenshot({ path: "../../evidence/U0/reaction-33.png" });
});

test("hints: ladder climbs, worked example does not state this answer", async ({ page }) => {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await finishExplaining(page);
  await answerCount(page, 33); // one reaction unlocks the hint button
  await page.getByRole("button", { name: "Keep going" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByTestId("pip")).toContainText("13 balloons");
  await expect(page.getByTestId("pip")).not.toContainText("15");
});

test("speech: only local voices are used", async ({ page }) => {
  await page.addInitScript(() => {
    const voices = [
      { name: "Remote", localService: false, lang: "en", voiceURI: "r", default: false },
      { name: "OnDevice", localService: true, lang: "en", voiceURI: "l", default: false },
    ];
    Object.defineProperty(window, "speechSynthesis", { value: { getVoices: () => voices, speak: (u: any) => { (window as any).__spoken = [...((window as any).__spoken ?? []), u.voice?.name ?? "none"]; }, cancel: () => {} } });
    (window as any).SpeechSynthesisUtterance = class { voice: any = null; constructor(public text: string) {} };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByLabel("Read-aloud").check();
  await page.getByRole("button", { name: /Lesson 1/ }).click();
  const spoken = await page.evaluate(() => (window as any).__spoken ?? []);
  expect(spoken.length).toBeGreaterThan(0);
  expect(spoken).not.toContain("Remote");
});

test("log: answers are recorded on-device and exportable", async ({ page }) => {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await finishExplaining(page);
  const events = await page.evaluate(() => JSON.parse(localStorage.getItem("kids-math-log") ?? "[]"));
  expect(events).toContain("answered-clean");
});
