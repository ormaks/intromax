import { expect, test, type Page } from "@playwright/test";

/** Preloader: 1.5s minimum, up to a 5s cap on a slow first load — plus headroom. */
const PRELOADER_TIMEOUT = 8_000;

async function openContact(page: Page) {
  await page.goto("/contact");
  await expect(page.getByRole("status", { name: "Loading" })).toBeHidden({
    timeout: PRELOADER_TIMEOUT,
  });
}

/** The letters currently rising out of the form. */
const risingLetters = (page: Page) =>
  page.getByTestId("rising-letters").locator("span");

const channels = (page: Page) =>
  page.getByRole("list", { name: "Contact channels" }).getByRole("link");

test.describe("desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("heading, intro and form", async ({ page }) => {
    await openContact(page);
    await expect(page.locator("main h1")).toHaveText("Contact me");
    await expect(page.getByText(/Open to new offers/)).toBeVisible();
    await expect(page.getByLabel("message")).toBeVisible();
  });

  test("five channels with their addresses", async ({ page }) => {
    await openContact(page);
    const expected = [
      ["GitHub", "https://github.com/ormaks"],
      ["Email", "mailto:maks.chytailo@gmail.com"],
      ["LinkedIn", "https://www.linkedin.com/in/ormaks/"],
      ["Instagram", "https://www.instagram.com/maks_chytailo"],
      ["Telegram", "https://t.me/ormaks"],
    ] as const;
    await expect(channels(page)).toHaveCount(expected.length);
    for (const [name, href] of expected) {
      const link = channels(page).and(
        page.getByRole("link", { name, exact: true }),
      );
      await expect(link).toHaveAttribute("href", href);
      if (href.startsWith("http")) {
        await expect(link).toHaveAttribute("target", "_blank");
      }
    }
  });

  test("hovering a channel types its handle", async ({ page }) => {
    await openContact(page);
    await channels(page).first().hover();
    await expect(page.getByText("github.com/ormaks")).toBeVisible();
  });

  test("the CV opens in a dialog and closes on Escape", async ({ page }) => {
    await openContact(page);
    await page.getByRole("button", { name: "preview" }).click();

    const dialog = page.getByRole("dialog", { name: "CV preview" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("iframe")).toHaveAttribute(
      "src",
      "/cv/maks-chytailo-cv.pdf",
    );
    await expect(
      dialog.getByRole("link", { name: "download" }),
    ).toHaveAttribute("download", /\.pdf$/);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("typed characters rise and clean up after themselves", async ({
    page,
  }) => {
    await openContact(page);
    await page.getByLabel("name").click();
    await page.keyboard.type("Maks");

    await expect(risingLetters(page)).not.toHaveCount(0);
    await expect(risingLetters(page)).toHaveCount(0, { timeout: 3_000 });
  });

  test("in the email field, letters rise from the caret", async ({ page }) => {
    await openContact(page);
    const email = page.getByRole("textbox", { name: "email" });
    const field = (await email.boundingBox())!;
    await email.click();
    await page.keyboard.type("maks.chytailo@", { delay: 20 });

    // The latest letter starts well along the field, at the caret, rather
    // than at its left edge.
    const lefts = await risingLetters(page).evaluateAll((spans) =>
      spans.map((span) => parseFloat((span as HTMLElement).style.left)),
    );
    expect(Math.max(...lefts)).toBeGreaterThan(field.x + 60);
  });

  test("fits without scrolling at a short desktop height", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await openContact(page);
    const send = (await page
      .getByRole("button", { name: "Send" })
      .boundingBox())!;
    expect(send.y + send.height).toBeLessThanOrEqual(600);
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("preview opens the PDF in a new tab", async ({ page }) => {
    await openContact(page);
    const preview = page.getByRole("link", { name: "preview" });
    await expect(preview).toHaveAttribute("href", "/cv/maks-chytailo-cv.pdf");
    await expect(preview).toHaveAttribute("target", "_blank");
  });
});
