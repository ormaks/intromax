import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

/** Preloader: 1.5s minimum, up to a 5s cap on a slow first load — plus headroom. */
const PRELOADER_TIMEOUT = 8_000;

const calls = (page: Page) =>
  page.evaluate(
    () => (window as typeof window & { scCalls: string[] }).scCalls,
  );

const miniPlayer = (page: Page) =>
  page.getByRole("group", { name: "Now playing" });

async function playOnAbout(page: Page) {
  await page.goto("/about");
  await expect(page.getByRole("status", { name: "Loading" })).toBeHidden({
    timeout: PRELOADER_TIMEOUT,
  });
  await page
    .getByRole("group", { name: "Music player" })
    .getByRole("button", { name: "Play" })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Music player" })
      .getByRole("button", { name: "Pause" }),
  ).toBeVisible();
}

async function goTo(page: Page, name: RegExp, url: RegExp) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name })
    .click();
  await expect(page).toHaveURL(url);
}

test.use({ viewport: { width: 1440, height: 900 } });

test("SoundCloud doesn't load until a page asks for music", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("soundcloud.com")) requests.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("status", { name: "Loading" })).toBeHidden({
    timeout: PRELOADER_TIMEOUT,
  });
  expect(requests).toEqual([]);
});

test("music keeps playing on other pages, with a mini player to pause it", async ({
  page,
}) => {
  await playOnAbout(page);
  await expect(miniPlayer(page)).toHaveCount(0);

  await goTo(page, /skills/i, /\/skills$/);
  await expect(miniPlayer(page)).toBeVisible();
  await expect(miniPlayer(page).getByText("Test Track")).toBeVisible();
  // Navigating didn't stop the widget.
  expect(await calls(page)).toEqual(["volume:70", "play"]);

  await miniPlayer(page)
    .getByRole("button", { name: "Pause", exact: true })
    .click();
  await expect(
    miniPlayer(page).getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  expect(await calls(page)).toEqual(["volume:70", "play", "pause"]);

  await goTo(page, /contact/i, /\/contact$/);
  await expect(miniPlayer(page)).toBeVisible();
});

test("closing the mini player pauses and hides it", async ({ page }) => {
  await playOnAbout(page);
  await goTo(page, /home/i, /\/$/);

  await miniPlayer(page).getByRole("button", { name: "Close player" }).click();
  await expect(miniPlayer(page)).toHaveCount(0);
  expect(await calls(page)).toContain("pause");
});

test("the mini player's title leads back to the full player", async ({
  page,
}) => {
  await playOnAbout(page);
  await goTo(page, /skills/i, /\/skills$/);

  await miniPlayer(page).getByRole("link", { name: "Test Track" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(miniPlayer(page)).toHaveCount(0);
  await expect(
    page
      .getByRole("group", { name: "Music player" })
      .getByRole("button", { name: "Pause" }),
  ).toBeVisible();
});
