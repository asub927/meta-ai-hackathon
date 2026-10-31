import { expect, test } from "@playwright/test";

async function startLesson(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: /Stickers/ }).click();
}

test("shell: app shell serves offline after first visit", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Second load is SW-controlled, so module requests populate the runtime cache.
  await page.reload();
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
});

test("shell: resume returns to the saved phase", async ({ page }) => {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__kidsMathStorage.get("kids-math-progress"))).not.toBeNull();
  await page.reload();
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByTestId("resume-lesson").click();
  await expect(page.getByTestId("pip")).toContainText("How did you know?");
});

test("shell: log export/import round-trips events", async ({ page }) => {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await page.getByRole("button", { name: /counted|Giving|tens/i }).first().click();
  await page.reload();
  await page.getByRole("button", { name: "Start" }).click();
  const before = (await page.getByTestId("log-count").textContent()) ?? "0";
  expect(Number(before)).toBeGreaterThan(0);
  const beforeProgress = (await page.getByTestId("progress-count").textContent()) ?? "0";
  // Capture the exact exported bytes (including the checksum line) via the blob.
  await page.evaluate(() => {
    (window as any).__exported = null;
    const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob: any) => {
      void (blob as Blob).text().then((t) => { (window as any).__exported = t; });
      return orig(blob);
    };
  });
  await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-log").click(),
  ]);
  await expect.poll(() => page.evaluate(() => (window as any).__exported as string | null)).not.toBeNull();
  const exported = (await page.evaluate(() => (window as any).__exported as string | null)) ?? "";
  expect(exported).toContain("# sha256:");
  await page.evaluate(() => Promise.all([
    (window as any).__kidsMathStorage.remove("kids-math-log-v1"),
    (window as any).__kidsMathStorage.remove("kids-math-progress"),
    (window as any).__kidsMathStorage.remove("kids-math-sound"),
  ]));
  await page.reload();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByTestId("log-count")).toHaveText("0");
  await page.evaluate((text: string) => {
    const input = document.querySelector('[data-testid="import-log"]') as HTMLInputElement | null;
    if (!input) throw new Error("no import input");
    const dt = new DataTransfer();
    dt.items.add(new File([text], "kids-math-log.ndjson", { type: "application/x-ndjson" }));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, exported);
  await expect(page.getByTestId("log-count")).toHaveText(before);
  await expect(page.getByTestId("progress-count")).toHaveText(beforeProgress);
});

test("shell: a tampered log import is rejected at the boundary", async ({ page }) => {
  await startLesson(page);
  await page.getByRole("button", { name: "fewer" }).click();
  await page.getByRole("button", { name: /counted|Giving|tens/i }).first().click();
  await page.reload();
  await page.getByRole("button", { name: "Start" }).click();
  await page.evaluate(() => {
    (window as any).__exported = null;
    const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob: any) => {
      void (blob as Blob).text().then((t) => { (window as any).__exported = t; });
      return orig(blob);
    };
  });
  await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-log").click(),
  ]);
  await expect.poll(() => page.evaluate(() => (window as any).__exported as string | null)).not.toBeNull();
  const exported = (await page.evaluate(() => (window as any).__exported as string | null)) ?? "";
  const tampered = exported.replace("answered-clean", "answered-tampered");
  expect(tampered).not.toBe(exported);
  await page.evaluate((text: string) => {
    const input = document.querySelector('[data-testid="import-log"]') as HTMLInputElement | null;
    if (!input) throw new Error("no import input");
    const dt = new DataTransfer();
    dt.items.add(new File([text], "kids-math-log.ndjson", { type: "application/x-ndjson" }));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, tampered);
  await expect(page.getByTestId("import-error")).toContainText("checksum-mismatch");
});

test("shell: lesson loads with same-origin requests only", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await startLesson(page);
  const external = urls.filter(
    (u) => /^https?:/.test(u) && !u.includes("127.0.0.1") && !u.includes("localhost"),
  );
  expect(external).toEqual([]);
});
