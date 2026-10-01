import { expect, test, type Page } from "@playwright/test";

/** Preloader: 1.5s minimum, up to a 5s cap on a slow first load — plus headroom. */
const PRELOADER_TIMEOUT = 8_000;

const glyphs = (page: Page) => page.locator("[data-wordmark-glyph]");
const loader = (page: Page) => page.getByRole("status", { name: "Loading" });

/** Collects uncaught page errors and console errors for the whole test. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

/**
 * The lowest wordmark opacity seen over the first 2s after the loader lifts —
 * the window where the neon blink makes its burst of dips.
 */
async function lowestGlyphOpacity(page: Page): Promise<number> {
  await expect(loader(page)).toBeHidden({ timeout: PRELOADER_TIMEOUT });
  return page.evaluate(async () => {
    const glyph = document.querySelector("[data-wordmark-glyph]")!;
    let lowest = 1;
    for (let i = 0; i < 40; i++) {
      lowest = Math.min(lowest, Number(getComputedStyle(glyph).opacity));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return lowest;
  });
}

test("heading, subtitle and CONTACT ME", async ({ page }) => {
  await page.goto("/");
  await expect(loader(page)).toBeHidden({ timeout: PRELOADER_TIMEOUT });

  await expect(page.locator("main h1")).toHaveText(
    "Hi,I'm Maks,frontend developer.",
  );
  await expect(page.getByText("React / TypeScript / Next.js")).toBeVisible();

  await page.getByRole("link", { name: "Contact me" }).click();
  await expect(page).toHaveURL(/\/contact$/);
});

test.describe("desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("wordmark and its reflection are mounted", async ({ page }) => {
    await page.goto("/");
    // Six glyphs ("Ormaks") in the wordmark, six in the reflection.
    await expect(glyphs(page)).toHaveCount(12);
  });

  test("leaving mid-animation is clean", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(loader(page)).toBeHidden({ timeout: PRELOADER_TIMEOUT });

    // The draw-in runs for 5s after the loader; leave well before it ends.
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: /about/i })
      .click();
    await expect(page).toHaveURL(/\/about$/);
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test("the wordmark flickers", async ({ page }) => {
    await page.goto("/");
    expect(await lowestGlyphOpacity(page)).toBeLessThan(0.9);
  });

  test("the wordmark flickers with reduced motion too", async ({ page }) => {
    const errors = trackErrors(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    expect(await lowestGlyphOpacity(page)).toBeLessThan(0.9);
    expect(errors).toEqual([]);
  });
});

test.describe("tablet (800px)", () => {
  test.use({ viewport: { width: 800, height: 1024 } });

  test("wordmark without the reflection", async ({ page }) => {
    await page.goto("/");
    await expect(glyphs(page)).toHaveCount(6);
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("no wordmark in the DOM", async ({ page }) => {
    await page.goto("/");
    await expect(loader(page)).toBeHidden({ timeout: PRELOADER_TIMEOUT });
    await expect(glyphs(page)).toHaveCount(0);
  });
});
