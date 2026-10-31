import { expect, test } from "@playwright/test";

async function startLesson(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: /Stickers/ }).click();
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

test("hints: ladder climbs to the worked example explainer, then back to the question", async ({ page }) => {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await finishExplaining(page);
  await answerCount(page, 33); // one reaction unlocks the hint button
  await page.getByRole("button", { name: "Keep going" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByTestId("explainer-panel")).toBeVisible();
  await expect(page.getByTestId("explainer-question")).toContainText("Momo");
  await expect(page.getByTestId("explainer-step")).toContainText("24 take away 9. What is left?");
  await page.getByTestId("explainer-next").click();
  await expect(page.getByTestId("explainer-step")).toContainText("Here are 24.");
  await page.getByTestId("explainer-back").click();
  await expect(page.getByTestId("explainer-step")).toContainText("24 take away 9. What is left?");
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
  await page.getByRole("button", { name: /Stickers/ }).click();
  const spoken = await page.evaluate(() => (window as any).__spoken ?? []);
  expect(spoken.length).toBeGreaterThan(0);
  expect(spoken).not.toContain("Remote");
});

test("log: answers are recorded on-device and exportable", async ({ page }) => {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await finishExplaining(page);
  await expect.poll(async () => {
    const raw = await page.evaluate(() => (window as any).__kidsMathStorage.get("kids-math-log-v1"));
    return (JSON.parse(raw ?? "[]") as { type: string }[]).some((e) => e.type === "answered-clean");
  }).toBe(true);
});
