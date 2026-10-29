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

// Reach the first count question: predict "fewer", then the explaining choice.
async function reachCountQ(page: import("@playwright/test").Page) {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await page.getByRole("button", { name: /counted|Giving|tens/i }).first().click();
}

for (const v of [33, 9, 25, 14]) {
  test(`reaction plays out ${v}: staged pile matches the child`, async ({ page }) => {
    await reachCountQ(page);
    await answerCount(page, v);
    await expect(page.getByTestId("book-count")).toHaveText(String(v));
    await expect(page.getByTestId("start-count")).toHaveText("24");
    await expect(page.getByTestId("staging-kind")).toBeVisible();
    await expect(page.locator('[data-expression="puzzled"]')).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/wrong|try again/i);
  });
}

test("reaction 42 on final: count-together staging", async ({ page }) => {
  await reachCountQ(page);
  await answerCount(page, 15);
  await page.getByRole("button", { name: /counted|tens/i }).first().click();
  await answerCount(page, 42);
  await expect(page.getByTestId("staging-kind")).toHaveText("count-together");
  await expect(page.getByTestId("book-count")).toHaveText("42");
  await expect(page.getByTestId("start-count")).toHaveText("24");
  await expect(page.locator('[data-expression="puzzled"]')).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/wrong|try again/i);
});

test("reduced motion keeps state, drops movement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reachCountQ(page);
  await answerCount(page, 33);
  await expect(page.getByTestId("book-count")).toHaveText("33");
  await expect(page.getByTestId("start-count")).toHaveText("24");
  await expect(page.getByTestId("staging-kind")).toBeVisible();
});
