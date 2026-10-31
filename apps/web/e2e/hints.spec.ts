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

test("hints climb in order; worked example uses its own numbers; strategy recorded", async ({ page }) => {
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
  await expect(page.getByTestId("hint-cue")).toHaveAttribute("data-cue-kind", "worked");
  const worked = page.getByTestId("worked-example");
  await expect(worked).toBeVisible();
  await expect(worked).toContainText("12");
  await expect(worked).not.toContainText("15");
  expect(await page.getByTestId("worked-chip").allTextContents()).toEqual(["12", "4", "8"]);

  await answerCount(page, 15);
  await page.getByRole("button", { name: /counted|tens/i }).first().click();
  await expect.poll(async () => {
    const raw = await page.evaluate(() => (window as any).__kidsMathStorage.get("kids-math-log-v1"));
    return (JSON.parse(raw ?? "[]") as { type: string }[]).some((e) => e.type === "strategy");
  }).toBe(true);
});
