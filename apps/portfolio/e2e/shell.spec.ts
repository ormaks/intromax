import { expect, test } from "./fixtures";

const PAGES = [
  { path: "/", heading: "Hi, I'm Maks, frontend developer." },
  { path: "/about", heading: "About me" },
  { path: "/skills", heading: "Skills & Experience" },
  { path: "/contact", heading: "Contact me" },
] as const;

/** Preloader: 1.5s minimum, up to a 5s cap on a slow first load — plus headroom. */
const PRELOADER_TIMEOUT = 8_000;

test.describe("pages", () => {
  for (const page of PAGES) {
    test(`${page.path} renders behind a preloader that clears`, async ({
      page: browserPage,
    }) => {
      const response = await browserPage.goto(page.path);
      expect(response?.status()).toBe(200);

      // The loader is in the server HTML, so nothing flashes before it. On a
      // slow first load it lifts on `load`, when goto() returns.
      expect(await response?.text()).toContain('aria-label="Loading"');

      const loader = browserPage.getByRole("status", { name: "Loading" });
      await expect(loader).toBeHidden({ timeout: PRELOADER_TIMEOUT });

      await expect(
        browserPage.getByRole("heading", { level: 1, name: page.heading }),
      ).toBeVisible();
    });
  }
});

test("code-tag frame is decorative", async ({ page }) => {
  await page.goto("/about");

  for (const tag of ["<body>", "</body>", "</html>"]) {
    const el = page.getByText(tag, { exact: true });
    await expect(el).toBeAttached();
    await expect(el).toHaveAttribute("aria-hidden", "true");
  }
});

test("unknown path renders the custom 404 with no preloader or frame", async ({
  page,
}) => {
  const response = await page.goto("/definitely-not-a-page");
  expect(response?.status()).toBe(404);

  await expect(
    page.getByRole("heading", { name: "404 - Page not found" }),
  ).toBeVisible();
  await expect(page.getByRole("status", { name: "Loading" })).toHaveCount(0);
  await expect(page.getByText("</html>")).toHaveCount(0);
});

test("client-side navigation replays the preloader", async ({ page }) => {
  await page.goto("/");
  const loader = page.getByRole("status", { name: "Loading" });
  await expect(loader).toBeHidden({ timeout: PRELOADER_TIMEOUT });

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: /about/i })
    .click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(loader).toBeVisible();
  await expect(loader).toBeHidden({ timeout: PRELOADER_TIMEOUT });
  await expect(
    page.getByRole("heading", { level: 1, name: "About me" }),
  ).toBeVisible();
});

test.describe("desktop scroll lock", () => {
  const canScroll = () =>
    document.scrollingElement!.scrollHeight >
      document.scrollingElement!.clientHeight &&
    getComputedStyle(document.body).overflowY !== "hidden";

  test("does not scroll at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/contact");
    expect(await page.evaluate(canScroll)).toBe(false);
  });

  test("scrolls on a short desktop viewport instead of clipping", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 500 });
    await page.goto("/contact");
    expect(await page.evaluate(canScroll)).toBe(true);
  });

  test("scrolls normally on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("/contact");
    expect(await page.evaluate(canScroll)).toBe(true);
  });

  test("scrolls normally on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/contact");
    expect(await page.evaluate(canScroll)).toBe(true);
  });
});
