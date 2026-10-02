import { expect, test } from "./fixtures";

/** Preloader: 1.5s minimum, up to a 5s cap on a slow first load — plus headroom. */
const PRELOADER_TIMEOUT = 8_000;

test.use({ viewport: { width: 1440, height: 900 } });

test("a hover mid-bounce replays it once, after the current bounce ends", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(page.getByRole("status", { name: "Loading" })).toBeHidden({
    timeout: PRELOADER_TIMEOUT,
  });

  const letter = page.locator("main h1 [aria-hidden] > span").first();
  const box = (await letter.boundingBox())!;
  const over = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const away = { x: over.x, y: box.y + box.height + 120 };

  // Count bounce starts on the heading (animationstart bubbles).
  await page.evaluate(() => {
    const w = window as typeof window & { bounces: number[] };
    w.bounces = [];
    document
      .querySelector("main h1")!
      .addEventListener("animationstart", () =>
        w.bounces.push(performance.now()),
      );
  });
  const bounces = () =>
    page.evaluate(
      () => (window as typeof window & { bounces: number[] }).bounces,
    );

  // Sweep over the letter three times within the first bounce.
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(over.x, over.y);
    await page.mouse.move(away.x, away.y);
    await page.waitForTimeout(100);
  }

  // One bounce now, exactly one queued replay — never a restart mid-bounce.
  await expect.poll(async () => (await bounces()).length).toBe(2);
  const [first = 0, second = 0] = await bounces();
  expect(second - first).toBeGreaterThanOrEqual(950);

  await page.waitForTimeout(1200);
  expect(await bounces()).toHaveLength(2);

  // Once it has settled, a fresh hover bounces again straight away.
  await page.mouse.move(over.x, over.y);
  await expect.poll(async () => (await bounces()).length).toBe(3);
});
