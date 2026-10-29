import { expect, test, type Page } from "@playwright/test";

// U7 interaction layer. Assumes the lesson flow from lesson.spec.ts:
// Start -> "Lesson 1" -> predict question (answer "fewer") -> explaining
// (pick any "How did you know?" choice) -> first count question (answer 15).
// Uses mouse clicks, which Playwright dispatches as real pointer events
// (pointerdown/move/up), so onPointerDown handlers fire. Playwright is NOT
// run in the sandbox; the orchestrator runs this file.

async function startLesson(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: /Stickers/ }).click();
}

async function reachFirstCount(page: Page) {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await page.getByRole("button", { name: /counted|Giving|tens/i }).first().click();
  await expect(page.getByTestId("count-widget")).toBeVisible();
}

test("count widget: tap 15 counters, confirm reaches explaining", async ({ page }) => {
  await reachFirstCount(page);
  for (let n = 1; n <= 15; n++) {
    await page.getByTestId(`counter-${n}`).click();
  }
  await expect(page.getByTestId("count-value")).toHaveText("Count: 15");
  await page.getByTestId("count-confirm").click();
  await expect(page.getByTestId("pip")).toHaveText("How did you know?");
});

test("drag tray: drag 3 items, tray count updates, confirm answers", async ({ page }) => {
  await reachFirstCount(page);
  const tray = await page.getByTestId("tray-zone").boundingBox();
  expect(tray).not.toBeNull();
  for (let n = 1; n <= 3; n++) {
    const item = await page.getByTestId(`drag-item-${n}`).boundingBox();
    expect(item).not.toBeNull();
    await page.mouse.move(item!.x + item!.width / 2, item!.y + item!.height / 2);
    await page.mouse.down();
    await page.mouse.move(tray!.x + tray!.width / 2, tray!.y + tray!.height / 2, { steps: 12 });
    await page.mouse.up();
  }
  await expect(page.getByTestId("tray-counted")).toHaveText("3");
  await page.getByTestId("drag-confirm").click();
  // 3 is not the right count, so the lesson reacts (or explains on surprise
  // correct); either way the answer was accepted and we left "asking".
  await expect(page.getByText(/Keep going|How did you know\?/)).toBeVisible();
});

test("tap targets: widget buttons are at least 64x64", async ({ page }) => {
  await reachFirstCount(page);
  const widgetButtons = page.getByTestId("count-widget").getByRole("button");
  const widgetN = await widgetButtons.count();
  expect(widgetN).toBeGreaterThan(0);
  for (let i = 0; i < widgetN; i++) {
    const box = await widgetButtons.nth(i).boundingBox();
    expect(box, `count-widget button ${i}`).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(63.5);
    expect(box!.height).toBeGreaterThanOrEqual(63.5);
  }
  const dragItems = page.locator('[data-testid^="drag-item-"]:visible');
  const dragN = await dragItems.count();
  expect(dragN).toBeGreaterThan(0);
  for (let i = 0; i < Math.min(dragN, 5); i++) {
    const box = await dragItems.nth(i).boundingBox();
    expect(box, `drag item ${i}`).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(63.5);
    expect(box!.height).toBeGreaterThanOrEqual(63.5);
  }
});

async function assertNoOverlap(page: Page) {
  const boxes = await Promise.all(
    ["pip", "count-widget", "count-input-wrap"].map((id) => page.getByTestId(id).boundingBox()),
  );
  for (const [i, a] of boxes.entries()) {
    expect(a, `box ${i}`).not.toBeNull();
    for (const [j, b] of boxes.entries()) {
      if (i >= j) continue;
      expect(b, `box ${j}`).not.toBeNull();
      const overlaps = a!.x < b!.x + b!.width && b!.x < a!.x + a!.width
        && a!.y < b!.y + b!.height && b!.y < a!.y + a!.height;
      expect(overlaps, `boxes ${i} and ${j} overlap`).toBe(false);
    }
  }
}

test("no overlap in portrait (834x1194)", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await reachFirstCount(page);
  await assertNoOverlap(page);
});

test("no overlap in landscape (1194x834)", async ({ page }) => {
  await page.setViewportSize({ width: 1194, height: 834 });
  await reachFirstCount(page);
  await assertNoOverlap(page);
});
