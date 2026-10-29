import { expect, test } from "@playwright/test";

interface StoryScript { predicts: string[]; counts: number[] }

// Mirrors buildLesson1() in packages/core/src/lesson.ts:
// S1 take-from start-unknown (fewer, 24), S2 add-to start-unknown (more, 25),
// S3 compare bigger (25), S4 compare smaller (24), S5 two-step (more, fewer, 8).
const SCRIPTS: StoryScript[] = [
  { predicts: ["fewer"], counts: [24] },
  { predicts: ["more"], counts: [25] },
  { predicts: [], counts: [25] },
  { predicts: [], counts: [24] },
  { predicts: ["more", "fewer"], counts: [8] },
];

async function startLesson1(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByTestId("lesson1-button").click();
}

async function answerCount(page: import("@playwright/test").Page, v: number) {
  await page.getByTestId("count-input").fill(String(v));
  await page.getByRole("button", { name: "Answer" }).click();
}

async function finishExplaining(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /makes|counted|took back|added back|guessed/i }).first().click();
}

async function playStory(page: import("@playwright/test").Page, script: StoryScript) {
  for (const p of script.predicts) {
    await page.getByRole("button", { name: p, exact: true }).click();
    await finishExplaining(page);
  }
  for (const c of script.counts) {
    await answerCount(page, c);
    await finishExplaining(page);
  }
}

async function advanceFromDone(page: import("@playwright/test").Page, index: number) {
  if (index < SCRIPTS.length - 1) await page.getByTestId("next-story").click();
}

test("lesson1: all-right completes all 5 stories with zero console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await startLesson1(page);
  for (let i = 0; i < SCRIPTS.length; i++) {
    await playStory(page, SCRIPTS[i]!);
    await advanceFromDone(page, i);
  }
  await expect(page.getByTestId("lesson1-done")).toBeVisible();
  expect(errors).toEqual([]);
});

test("lesson1: story 1 misconception plays out, then lesson completes", async ({ page }) => {
  await startLesson1(page);
  const [first, ...rest] = SCRIPTS;
  for (const p of first!.predicts) {
    await page.getByRole("button", { name: p, exact: true }).click();
    await finishExplaining(page);
  }
  await answerCount(page, 33); // wrong: echoes the step, reaction plays
  await expect(page.getByTestId("pip")).not.toContainText(/wrong|incorrect|try again/i);
  await page.getByRole("button", { name: "Keep going" }).click();
  await answerCount(page, 24);
  await finishExplaining(page);
  await advanceFromDone(page, 0);
  for (let i = 0; i < rest.length; i++) {
    await playStory(page, rest[i]!);
    await advanceFromDone(page, i + 1);
  }
  await expect(page.getByTestId("lesson1-done")).toBeVisible();
});

test("lesson1: hints climb to the worked example, then lesson completes", async ({ page }) => {
  await startLesson1(page);
  const [first, ...rest] = SCRIPTS;
  for (const p of first!.predicts) {
    await page.getByRole("button", { name: p, exact: true }).click();
    await finishExplaining(page);
  }
  await answerCount(page, 33); // one reaction unlocks the hint button
  await page.getByRole("button", { name: "Keep going" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByTestId("pip")).toContainText("Ended with 10");
  await expect(page.getByTestId("pip")).not.toContainText("24");
  await answerCount(page, 24);
  await finishExplaining(page);
  await advanceFromDone(page, 0);
  for (let i = 0; i < rest.length; i++) {
    await playStory(page, rest[i]!);
    await advanceFromDone(page, i + 1);
  }
  await expect(page.getByTestId("lesson1-done")).toBeVisible();
});
