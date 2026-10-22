import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

/** Preloader: 1.5s minimum, up to a 5s cap on a slow first load — plus headroom. */
const PRELOADER_TIMEOUT = 8_000;

const game = (page: Page) => page.getByTestId("runner-game");

async function openLab(page: Page) {
  await page.goto("/lab");
  await expect(page.getByRole("status", { name: "Loading" })).toBeHidden({
    timeout: PRELOADER_TIMEOUT,
  });
}

test.describe("desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("heading, copy and the record line", async ({ page }) => {
    await openLab(page);

    await expect(page.locator("main h1")).toHaveCSS(
      "color",
      "rgb(8, 253, 216)",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "Lab" }),
    ).toBeVisible();
    await expect(page.getByText("Coming soon...").first()).toBeVisible();
    await expect(page.getByText(/try to beat my record/)).toBeVisible();
    await expect(page.getByText(/My record: \d{5}/)).toBeVisible();
    await expect(page.getByText("Your best: 00000")).toBeVisible();
    await expect(game(page)).toBeVisible();
  });

  test("space starts the game", async ({ page }) => {
    await openLab(page);
    await expect(game(page)).toHaveAttribute("data-state", "idle");
    await expect(
      page.getByRole("button", { name: /click to play/ }),
    ).toBeVisible();

    await page.keyboard.press("Space");
    await expect(game(page)).toHaveAttribute("data-state", "running");
  });

  test("a crash ends the run, saves the best, and the same key restarts", async ({
    page,
  }) => {
    await openLab(page);
    // Started and left alone, the runner hits the first obstacle.
    await page.keyboard.press("Space");
    await expect(game(page)).toHaveAttribute("data-state", "over", {
      timeout: 10_000,
    });
    await expect(page.getByText(/Your best: (?!00000)\d{5}/)).toBeVisible();

    // Past the short lockout after a crash.
    await page.waitForTimeout(600);
    await page.keyboard.press("Space");
    await expect(game(page)).toHaveAttribute("data-state", "running");

    await page.reload();
    await expect(page.getByText(/Your best: (?!00000)\d{5}/)).toBeVisible({
      timeout: PRELOADER_TIMEOUT,
    });
  });

  test("a stored best score is shown", async ({ page }) => {
    await page.addInitScript(() =>
      window.localStorage.setItem("intromax:lab-best", "321"),
    );
    await openLab(page);
    await expect(page.getByText("Your best: 00321")).toBeVisible();
  });

  test("the page fits the frame without scrolling", async ({ page }) => {
    await openLab(page);
    const scrolls = await page.evaluate(
      () =>
        document.documentElement.scrollHeight > window.innerHeight ||
        document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(scrolls).toBe(false);
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("tapping the play prompt starts the game", async ({ page }) => {
    await openLab(page);
    await page.getByRole("button", { name: /click to play/ }).click();
    await expect(game(page)).toHaveAttribute("data-state", "running");
  });

  test("no horizontal overflow", async ({ page }) => {
    await openLab(page);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows).toBe(false);
  });
});
