import { expect, test } from "@playwright/test";

// PLAN.md:424 (U6): __render.seek(t) is deterministic — the same timestamp
// hashed twice must give the same frame. Three timestamps, two hashes each.

async function frameHash(page: import("@playwright/test").Page, t: number) {
  return page.evaluate((ms: number) => {
    (window as any).__render.seek(ms);
    return document.body.dataset.frame ?? "";
  }, t);
}

test("seek: same timestamp hashes to the same frame twice", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: /Stickers/ }).click();
  for (const t of [0, 250, 1000]) {
    expect(await frameHash(page, t), `seek(${t}) first`).not.toBe("");
    expect(await frameHash(page, t), `seek(${t}) repeat`).toBe(await frameHash(page, t));
  }
});
