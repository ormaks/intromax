import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

/** Preloader: 1.5s minimum, up to a 5s cap on a slow first load — plus headroom. */
const PRELOADER_TIMEOUT = 8_000;

const CASE_STUDIES = [
  "WorkJam - enterprise workforce platform",
  "Esko - billing for packaging software",
  "Design-led real-estate sites",
  "Early projects",
];

async function openExperience(page: Page) {
  await page.goto("/experience");
  await expect(page.getByRole("status", { name: "Loading" })).toBeHidden({
    timeout: PRELOADER_TIMEOUT,
  });
}

/** The scroll container the page content lives in on desktop. */
const scrollBox = (page: Page) =>
  page.getByRole("region", { name: "Page content" });

test.describe("desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("heading, case studies, diagrams and the career timeline", async ({
    page,
  }) => {
    await openExperience(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "Experience", exact: true }),
    ).toBeVisible();
    for (const name of [...CASE_STUDIES, "Career"]) {
      await expect(
        page.getByRole("heading", { level: 2, name, exact: true }),
      ).toBeAttached();
    }
    await expect(
      page.getByRole("img", { name: /^WorkJam platform diagram/ }),
    ).toBeAttached();
    await expect(
      page.getByRole("img", { name: /^Chat bridge diagram/ }),
    ).toBeAttached();
    await expect(
      page.getByRole("list", { name: "Stack" }).first().getByRole("listitem"),
    ).not.toHaveCount(0);
    await expect(page.getByText("Nov 2019 - present")).toBeAttached();
  });

  test("the content scrolls inside the frame, not the document", async ({
    page,
  }) => {
    await openExperience(page);
    const closingTag = page.getByText("</body>");
    const tagTop = (await closingTag.boundingBox())!.y;

    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 1500);
    await expect
      .poll(() => scrollBox(page).evaluate((el) => el.scrollTop))
      .toBeGreaterThan(500);

    expect(
      await page.evaluate(() => document.scrollingElement!.scrollTop),
    ).toBe(0);
    expect((await closingTag.boundingBox())!.y).toBe(tagTop);
  });

  test("the content scrolls from the keyboard", async ({ page }) => {
    await openExperience(page);
    await scrollBox(page).focus();
    await page.keyboard.press("End");
    await expect
      .poll(() => scrollBox(page).evaluate((el) => el.scrollTop))
      .toBeGreaterThan(1000);
  });

  test("jump links scroll to their section", async ({ page }) => {
    await openExperience(page);
    const nav = page.getByRole("navigation", { name: "On this page" });

    await nav.getByRole("link", { name: "Career" }).click();
    const heading = page.getByRole("heading", { level: 2, name: "Career" });
    await expect(heading).toBeInViewport();
    await expect
      .poll(() => scrollBox(page).evaluate((el) => el.scrollTop))
      .toBeGreaterThan(1000);
    expect(
      await page.evaluate(() => document.scrollingElement!.scrollTop),
    ).toBe(0);
  });

  test("reading text is set in Inter, headings in the display face", async ({
    page,
  }) => {
    await openExperience(page);
    const body = page.getByText(/^WorkJam is a frontline workforce platform/);
    expect(
      await body.evaluate((el) => getComputedStyle(el).fontFamily),
    ).toMatch(/inter/i);
    const heading = page.getByRole("heading", { level: 1 });
    expect(
      await heading.evaluate((el) => getComputedStyle(el).fontFamily),
    ).not.toMatch(/inter/i);
  });

  test("the backdrop links stars to the pointer", async ({ page }) => {
    await openExperience(page);
    const backdrop = page.getByTestId("constellation-backdrop");
    await expect(backdrop).toHaveAttribute("aria-hidden", "true");

    // Lit pixels in a 200px box around (1100, 650), the canvas's own space.
    const litAround = () =>
      backdrop.evaluate((canvas: HTMLCanvasElement) => {
        const ratio = window.devicePixelRatio || 1;
        const { data } = canvas
          .getContext("2d")!
          .getImageData(1000 * ratio, 550 * ratio, 200 * ratio, 200 * ratio);
        let lit = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) lit++;
        return lit;
      });

    await page.mouse.move(100, 100);
    await page.waitForTimeout(300);
    const before = await litAround();
    await page.mouse.move(1100, 650);
    await expect.poll(litAround).toBeGreaterThan(before);
  });

  test("ends with a link to the contact page", async ({ page }) => {
    await openExperience(page);
    await page.getByRole("link", { name: "Contact me" }).click();
    await expect(page).toHaveURL(/\/contact$/);
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("the document scrolls and nothing overflows sideways", async ({
    page,
  }) => {
    await openExperience(page);
    await page.getByRole("link", { name: "Career" }).click();
    await expect(
      page.getByRole("heading", { level: 2, name: "Career" }),
    ).toBeInViewport();
    expect(
      await page.evaluate(() => document.scrollingElement!.scrollTop),
    ).toBeGreaterThan(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBe(0);
  });
});
