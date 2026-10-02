import { expect, test } from "@playwright/test";

const sphere = "canvas[data-assembled]";

test.describe("desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("an unknown path shows the heading and the way home", async ({
    page,
  }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);

    await expect(
      page.getByRole("heading", { name: "404 - Page not found" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Take me home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("reaching for home rebuilds the sphere", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.locator(sphere)).toHaveCount(0);

    await page.getByRole("link", { name: "Take me home" }).hover();
    await expect(page.locator(sphere)).toHaveCount(1);

    await page.mouse.move(5, 5);
    await expect(page.locator(sphere)).toHaveCount(0);
  });

  test("keyboard focus on the way home rebuilds it too", async ({ page }) => {
    await page.goto("/no-such-page");
    await page.getByRole("link", { name: "Take me home" }).focus();
    await expect(page.locator(sphere)).toHaveCount(1);
  });
});
