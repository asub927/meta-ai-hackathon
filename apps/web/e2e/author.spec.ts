// @ts-ignore: @types/node is not a dependency; this spec runs under Node via Playwright.
import { promises as fs } from "node:fs";
// @ts-ignore: @types/node is not a dependency; this spec runs under Node via Playwright.
import path from "node:path";
// @ts-ignore: @types/node is not a dependency; this spec runs under Node via Playwright.
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const EVIDENCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../evidence/U15a/authored-lesson.json");

test("author: teacher authors a start-unknown lesson that validates", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/#/author");
  await expect(page.getByRole("heading", { name: "Author a lesson" })).toBeVisible();

  await page.getByTestId("author-lesson-id").fill("author-shells-start");
  await page.getByTestId("author-hero").fill("Momo");
  await page.getByTestId("author-friend").fill("Kiwi");
  await page.getByTestId("author-item").fill("shells");
  await page.getByTestId("author-kind").selectOption("take-from-start");
  await page.getByTestId("author-result").fill("15");
  await page.getByTestId("author-change").fill("9");

  await expect(page.getByTestId("author-status")).toHaveText("Lesson ready");
  await expect(page.getByTestId("author-preview")).toContainText("Answer 24.");
  await expect(page.getByTestId("author-questions")).toContainText("How many did Momo start with?");

  const raw = await page.getByTestId("author-output").textContent();
  expect(raw).toBeTruthy();
  const lesson = JSON.parse(raw!);
  expect(lesson.id).toBe("author-shells-start");
  expect(lesson.standard).toBe("NC.2.OA.1");
  expect(lesson.stories).toHaveLength(1);
  expect(lesson.stories[0].solved.totals).toEqual([24, 15]);
  expect(lesson.stories[0].solved.answer).toBe(24);
  expect(lesson.stories[0].source.licence).toBe("CC BY-SA 4.0");

  await fs.mkdir(path.dirname(EVIDENCE), { recursive: true });
  await fs.writeFile(EVIDENCE, raw!);
  expect(errors).toEqual([]);
});
