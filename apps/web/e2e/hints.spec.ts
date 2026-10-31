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

// Reach the first count question: predict "fewer", then the explaining choice.
async function reachCountQ(page: import("@playwright/test").Page) {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await page.getByRole("button", { name: /counted|Giving|tens/i }).first().click();
}

test("hints climb to the worked example explainer, then return to the question", async ({ page }) => {
  await reachCountQ(page);
  await answerCount(page, 33); // one reaction unlocks the hint button
  await page.getByRole("button", { name: "Keep going" }).click();
  await expect(page.getByRole("button", { name: "Hint" })).toBeVisible();

  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByTestId("hint-cue")).toHaveAttribute("data-cue-kind", "question");

  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByTestId("hint-cue")).toHaveAttribute("data-cue-kind", "ten-frame");
  await expect(page.getByTestId("ten-frame-dot")).toHaveCount(15);

  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByTestId("hint-cue")).toHaveAttribute("data-cue-kind", "explainer");
  const panel = page.getByTestId("explainer-panel");
  await expect(panel).toBeVisible();

  // The original question stays pinned at the top of the panel.
  const question = await page.getByTestId("explainer-question").textContent();
  expect(question).toContain("Momo");
  // No mascot voice inside the explainer.
  expect(await panel.textContent()).not.toContain("Pip");
  expect(await panel.textContent()).not.toContain("puffbun");

  // One idea per step: Next advances exactly one step, Back returns.
  await expect(page.getByTestId("explainer-step")).toContainText("24 take away 9. What is left?");
  await expect(page.getByTestId("explainer-progress")).toContainText("Step 1 of 5");
  await page.getByTestId("explainer-next").click();
  await expect(page.getByTestId("explainer-step")).toContainText("Here are 24.");
  await expect(page.getByTestId("explainer-progress")).toContainText("Step 2 of 5");
  await expect(page.getByTestId("explainer-question")).toHaveText(question ?? "");
  await page.getByTestId("explainer-back").click();
  await expect(page.getByTestId("explainer-step")).toContainText("24 take away 9. What is left?");

  // Walk to the summary, then Try it returns to the re-asked original question.
  for (let i = 0; i < 4; i++) await page.getByTestId("explainer-next").click();
  await expect(page.getByTestId("explainer-step")).toContainText("24 take away 9 leaves 15.");
  await page.getByTestId("explainer-done").click();
  await expect(panel).toBeHidden();
  await expect(page.getByTestId("pip")).toHaveText(question ?? "");
  await expect(page.getByTestId("count-input")).toBeVisible();

  // The re-asked smaller question still records the strategy on success.
  await answerCount(page, 15);
  await page.getByRole("button", { name: /counted|tens/i }).first().click();
  await expect.poll(async () => {
    const raw = await page.evaluate(() => (window as any).__kidsMathStorage.get("kids-math-log-v1"));
    return (JSON.parse(raw ?? "[]") as { type: string }[]).some((e) => e.type === "strategy");
  }).toBe(true);
});
