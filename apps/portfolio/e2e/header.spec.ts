import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const nav = (page: Page) => page.getByRole("navigation", { name: "Primary" });
const burger = (page: Page) =>
  page.getByRole("button", { name: "Menu", exact: true });

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("burger opens and closes the menu", async ({ page }) => {
    await page.goto("/about");

    // Closed: nav and socials wait off-screen and are hidden from AT/focus.
    await expect(nav(page)).toBeHidden();
    await expect(burger(page)).toHaveAttribute("aria-expanded", "false");

    await burger(page).click();
    await expect(burger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(nav(page)).toBeVisible();
    await expect(page.getByRole("link", { name: "Telegram" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(burger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(nav(page)).toBeHidden();
  });

  test("Escape from inside the menu returns focus to the burger", async ({
    page,
  }) => {
    await page.goto("/about");
    await burger(page).click();
    await nav(page)
      .getByRole("link", { name: /skills/i })
      .focus();

    await page.keyboard.press("Escape");
    await expect(nav(page)).toBeHidden();
    await expect(burger(page)).toBeFocused();
  });

  test("back navigation closes the menu", async ({ page }) => {
    await page.goto("/about");
    await burger(page).click();
    await nav(page)
      .getByRole("link", { name: /contact/i })
      .click();
    await expect(page).toHaveURL(/\/contact$/);

    await burger(page).click();
    await expect(burger(page)).toHaveAttribute("aria-expanded", "true");
    await page.goBack();

    await expect(page).toHaveURL(/\/about$/);
    await expect(burger(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("choosing a page closes the menu", async ({ page }) => {
    await page.goto("/about");
    await burger(page).click();
    await nav(page)
      .getByRole("link", { name: /contact/i })
      .click();

    await expect(page).toHaveURL(/\/contact$/);
    await expect(burger(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("no horizontal overflow from the off-screen panels", async ({
    page,
  }) => {
    await page.goto("/about");
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows).toBe(false);
  });
});

test.describe("tablet (800px)", () => {
  test.use({ viewport: { width: 800, height: 600 } });

  test("top bar shows nav and socials without a burger", async ({ page }) => {
    await page.goto("/about");
    await expect(nav(page)).toBeVisible();
    await expect(page.getByRole("link", { name: "Instagram" })).toBeVisible();
    await expect(burger(page)).toBeHidden();

    const header = await page.locator("header").boundingBox();
    expect(header?.height).toBe(60);
    expect(header?.width).toBe(800);
  });
});

test.describe("desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("side rail with the active page marked", async ({ page }) => {
    await page.goto("/skills");

    const header = await page.locator("header").boundingBox();
    expect(header?.width).toBe(55);
    expect(header?.height).toBe(900);

    const active = nav(page).getByRole("link", { name: /skills/i });
    await expect(active).toHaveAttribute("aria-current", "page");
  });

  test("hovering a nav item widens it into a tab", async ({ page }) => {
    await page.goto("/skills");
    const home = nav(page).getByRole("link", { name: /home/i });

    await home.hover();
    await expect.poll(async () => (await home.boundingBox())?.width).toBe(64);
    // Accent on hover — guards against a default hover colour winning.
    await expect(home).toHaveCSS("color", "rgb(8, 253, 216)");
  });
});

test("every nav and social link has an accessible name", async ({ page }) => {
  await page.goto("/");
  for (const name of [/home/i, /about/i, /skills/i, /contact/i]) {
    await expect(nav(page).getByRole("link", { name })).toHaveCount(1);
  }
  for (const name of ["Facebook", "Instagram", "Telegram"]) {
    await expect(page.getByRole("link", { name })).toHaveCount(1);
  }
});
