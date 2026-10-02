import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

/** Preloader: 1.5s minimum, up to a 5s cap on a slow first load — plus headroom. */
const PRELOADER_TIMEOUT = 8_000;
/** The player gives up on SoundCloud after 10s. */
const BLOCKED_TIMEOUT = 13_000;

const calls = (page: Page) =>
  page.evaluate(
    () => (window as typeof window & { scCalls: string[] }).scCalls,
  );

async function openAbout(page: Page) {
  await page.goto("/about");
  await expect(page.getByRole("status", { name: "Loading" })).toBeHidden({
    timeout: PRELOADER_TIMEOUT,
  });
}

test.describe("desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("accent heading and bio", async ({ page }) => {
    await openAbout(page);

    await expect(page.locator("main h1")).toHaveCSS(
      "color",
      "rgb(8, 253, 216)",
    );
    await expect(
      page.getByText(/Open to new offers - get in touch\./),
    ).toBeVisible();
  });

  test("the player loads, plays and seeks", async ({ page }) => {
    await openAbout(page);

    const player = page.getByRole("group", { name: "Music player" });
    await expect(player).toHaveAttribute("aria-busy", "false");
    await expect(player.getByText("Test Track")).toBeVisible();
    await expect(player.getByText("Test Artist")).toBeVisible();

    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

    const slider = page.getByRole("slider", { name: "Seek" });
    const box = (await slider.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(slider).toHaveAttribute("aria-valuenow", "100");

    await slider.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuenow", "105");

    expect(await calls(page)).toEqual(
      expect.arrayContaining(["play", "seek:105000"]),
    );
  });

  test("the wolf bends away from the pointer and springs back", async ({
    page,
  }) => {
    await openAbout(page);

    const wolf = page.getByTestId("reactive-wolf").locator("svg");
    const box = (await wolf.boundingBox())!;
    const line = wolf.locator("[data-wolf-line]").nth(30);
    const original = await line.getAttribute("points");

    // The wolf only reacts once its draw-in has finished, so keep sweeping
    // the pointer across it until the lines respond.
    await expect
      .poll(
        async () => {
          for (let i = 0; i <= 10; i++) {
            await page.mouse.move(
              box.x + box.width * (0.6 + i * 0.03),
              box.y + box.height * 0.3,
            );
          }
          return line.getAttribute("points");
        },
        { timeout: 8_000 },
      )
      .not.toBe(original);

    await page.mouse.move(5, 5);
    const settled = (points: string | null) =>
      points
        ?.split(" ")
        .map((point) => point.split(",").map((n) => Number(n).toFixed(1)))
        .join(" ");
    await expect
      .poll(async () => settled(await line.getAttribute("points")), {
        timeout: 5_000,
      })
      .toBe(settled(original));
  });

  test("a click on the wolf sends out a ripple and a shockwave", async ({
    page,
  }) => {
    await openAbout(page);

    const wolf = page.getByTestId("reactive-wolf").locator("svg");
    const box = (await wolf.boundingBox())!;
    const line = wolf.locator("[data-wolf-line]").nth(30);
    const original = await line.getAttribute("points");
    const ripples = page.locator("[data-wolf-ripple]");
    const at = { x: box.x + box.width * 0.75, y: box.y + box.height * 0.35 };

    // Clicks only shake the lines once the draw-in has finished, so keep
    // clicking until they respond.
    await expect
      .poll(
        async () => {
          await page.mouse.click(at.x, at.y);
          return line.getAttribute("points");
        },
        { timeout: 8_000 },
      )
      .not.toBe(original);
    await expect(ripples.first()).toBeAttached();

    // The ring removes itself, and the wolf settles back once the pointer
    // leaves.
    await page.mouse.move(5, 5);
    await expect(ripples).toHaveCount(0, { timeout: 3_000 });
    const settled = (points: string | null) =>
      points
        ?.split(" ")
        .map((point) => point.split(",").map((n) => Number(n).toFixed(1)))
        .join(" ");
    await expect
      .poll(async () => settled(await line.getAttribute("points")), {
        timeout: 5_000,
      })
      .toBe(settled(original));
  });
});

test("leaving About while the player is loaded is clean", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openAbout(page);
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: /contact/i })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Contact me" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("blocked widget", () => {
  test.use({ soundCloud: "blocked" });

  test("falls back to a SoundCloud link", async ({ page }) => {
    await openAbout(page);

    await expect(
      page.getByRole("link", { name: "Listen on SoundCloud" }),
    ).toBeVisible({ timeout: BLOCKED_TIMEOUT });
  });
});

test.describe("track with no sound", () => {
  test.use({ soundCloud: "no-sound" });

  test("falls back to the link", async ({ page }) => {
    await openAbout(page);

    await expect(
      page.getByRole("link", { name: "Listen on SoundCloud" }),
    ).toBeVisible();
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("player without the wolf", async ({ page }) => {
    await openAbout(page);

    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await expect(page.getByTestId("reactive-wolf")).toHaveCount(0);
  });
});
