import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

/** Preloader: 1.5s minimum, up to a 5s cap on a slow first load — plus headroom. */
const PRELOADER_TIMEOUT = 8_000;

const words = (page: Page) =>
  page.getByRole("list", { name: "Skills" }).getByRole("listitem");

async function openSkills(page: Page) {
  await page.goto("/skills");
  await expect(page.getByRole("status", { name: "Loading" })).toBeHidden({
    timeout: PRELOADER_TIMEOUT,
  });
}

/** Names of the skills currently lit at full brightness. */
const litSkills = (page: Page) =>
  page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>('[aria-label="Skills"] li'),
    )
      .filter((li) => Number(li.style.opacity) >= 0.99)
      .map((li) => li.textContent),
  );

/** The scale of each lit word, in list order. */
const litScales = (page: Page) =>
  page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>('[aria-label="Skills"] li'),
    )
      .filter((li) => Number(li.style.opacity) >= 0.99)
      .map((li) => Number(/scale\(([\d.]+)\)/.exec(li.style.transform)?.[1])),
  );

/** Total distance the words travel over `ms`. */
const wordTravel = (page: Page, ms: number) =>
  page.evaluate(async (wait) => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>('[aria-label="Skills"] li'),
    );
    const centres = () =>
      items.map((li) => {
        const box = li.getBoundingClientRect();
        return [box.x + box.width / 2, box.y + box.height / 2] as const;
      });
    const before = centres();
    await new Promise((resolve) => setTimeout(resolve, wait));
    return centres().reduce((sum, [x, y], i) => {
      const [bx = x, by = y] = before[i] ?? [];
      return sum + Math.hypot(x - bx, y - by);
    }, 0);
  }, ms);

test.describe("desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("heading, prose and 34 skills", async ({ page }) => {
    await openSkills(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "Skills & Experience" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "GraphQL" })).toBeVisible();
    await expect(words(page)).toHaveCount(34);
  });

  test("a linked word lights only its skill and turns it to the front", async ({
    page,
  }) => {
    await openSkills(page);
    await page.getByRole("button", { name: "GraphQL" }).hover();

    await expect.poll(() => litSkills(page)).toEqual(["GraphQL"]);
    const sphere = (await page
      .getByRole("list", { name: "Skills" })
      .locator("..")
      .boundingBox())!;
    const word = words(page).filter({ hasText: /^GraphQL$/ });
    await expect
      .poll(
        async () => {
          const box = (await word.boundingBox())!;
          return Math.hypot(
            box.x + box.width / 2 - (sphere.x + sphere.width / 2),
            box.y + box.height / 2 - (sphere.y + sphere.height / 2),
          );
        },
        { timeout: 5_000 },
      )
      .toBeLessThan(30);
  });

  test("a held focus survives hovering a sphere word", async ({ page }) => {
    await openSkills(page);
    await page.getByRole("button", { name: "GraphQL" }).focus();
    await expect.poll(() => litSkills(page)).toEqual(["GraphQL"]);

    const other = words(page).filter({ hasText: /^Webpack$/ });
    await other.hover({ force: true });
    await page.mouse.move(300, 700);

    await expect.poll(() => litSkills(page)).toEqual(["GraphQL"]);
  });

  test("a category chip lights its whole group", async ({ page }) => {
    await openSkills(page);
    await page.getByRole("button", { name: "data and state" }).hover();

    await expect
      .poll(async () => (await litSkills(page)).sort())
      .toEqual(
        [
          "Apollo Client",
          "Firebase",
          "GraphQL",
          "MobX",
          "NoSQL",
          "REST",
          "Redux",
          "Redux-Saga",
        ].sort(),
      );

    await page.mouse.move(5, 5);
    await expect.poll(() => litSkills(page)).not.toContain("MobX");
  });

  test("each category turns to the front as one group", async ({ page }) => {
    await openSkills(page);
    for (const chip of [
      "core",
      "styling and motion",
      "data and state",
      "tooling and testing",
    ]) {
      await page.getByRole("button", { name: chip }).hover();
      // Lit words scale by depth; one left on the far side stays small.
      await expect
        .poll(
          async () => {
            const scales = await litScales(page);
            return scales.length > 0 ? Math.min(...scales) : 0;
          },
          { timeout: 5_000, message: chip },
        )
        .toBeGreaterThan(1.1);
    }
  });

  test("clicking a chip pulses through its group", async ({ page }) => {
    await openSkills(page);
    const chip = page.getByRole("button", { name: "tooling and testing" });
    await chip.hover();
    await page.waitForTimeout(2_000);
    // Each word a pulse reaches swells briefly, so watch every frame for a
    // few seconds after the click rather than polling for the swell.
    const swollen = page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const words = Array.from(
            document.querySelectorAll<HTMLElement>('[aria-label="Skills"] li'),
          );
          const scale = (li: HTMLElement) =>
            Number(/scale\(([\d.]+)\)/.exec(li.style.transform)?.[1] ?? 0);
          const lit = words.filter((li) => Number(li.style.opacity) >= 0.99);
          const settled = new Map(lit.map((li) => [li, scale(li)]));
          const grew = new Set<HTMLElement>();
          const end = performance.now() + 3_000;
          const sample = () => {
            for (const [li, rest] of settled)
              if (scale(li) > rest + 0.08) grew.add(li);
            if (performance.now() < end) requestAnimationFrame(sample);
            else resolve(grew.size);
          };
          requestAnimationFrame(sample);
        }),
    );
    await chip.click();
    expect(await swollen).toBeGreaterThan(2);
  });

  test("hovering a word on the sphere stops the spin", async ({ page }) => {
    await openSkills(page);
    // The frontmost word: the one drawn on top.
    const front = await page.evaluate(
      () =>
        Array.from(
          document.querySelectorAll<HTMLElement>('[aria-label="Skills"] li'),
        ).reduce((best, li) =>
          Number(li.style.zIndex) > Number(best.style.zIndex) ? li : best,
        ).textContent,
    );
    const word = words(page).filter({ hasText: new RegExp(`^${front}$`) });
    const box = (await word.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(600);

    expect(await wordTravel(page, 500)).toBeLessThan(3);

    await page.mouse.move(300, 700);
    await expect.poll(() => wordTravel(page, 300)).toBeGreaterThan(3);
  });

  test("words on the far side of the sphere ignore the pointer", async ({
    page,
  }) => {
    await openSkills(page);
    // Drawn order follows depth: the lowest z-index is the furthest back.
    const pointerEvents = () =>
      page.evaluate(() => {
        const items = Array.from(
          document.querySelectorAll<HTMLElement>('[aria-label="Skills"] li'),
        ).sort((a, b) => Number(a.style.zIndex) - Number(b.style.zIndex));
        return {
          back: getComputedStyle(items[0]!).pointerEvents,
          front: getComputedStyle(items.at(-1)!).pointerEvents,
        };
      });
    await expect.poll(pointerEvents).toEqual({ back: "none", front: "auto" });
  });

  test("the pointer steers over the sphere column, not the text", async ({
    page,
  }) => {
    await openSkills(page);
    const sphere = (await page
      .getByRole("list", { name: "Skills" })
      .locator("..")
      .boundingBox())!;

    await page.mouse.move(300, 700);
    await page.waitForTimeout(800);
    const overText = await wordTravel(page, 500);

    await page.mouse.move(
      sphere.x + sphere.width + 60,
      sphere.y + sphere.height / 2,
    );
    await page.waitForTimeout(800);
    const overSphere = await wordTravel(page, 500);

    expect(overSphere).toBeGreaterThan(overText * 3);
  });

  test("LinkedIn opens in a new tab; contact navigates", async ({ page }) => {
    await openSkills(page);
    const linkedIn = page.getByRole("link", { name: "LinkedIn" });
    await expect(linkedIn).toHaveAttribute("target", "_blank");
    await expect(linkedIn).toHaveAttribute("href", /linkedin\.com\/in\/ormaks/);

    const contact = page
      .getByRole("main")
      .getByRole("link", { name: "contact", exact: true });
    await expect(contact).not.toHaveAttribute("target", "_blank");
    await contact.click();
    await expect(page).toHaveURL(/\/contact$/);
  });

  test("the experience link animates and opens the Experience page", async ({
    page,
  }) => {
    await openSkills(page);
    const link = page.getByRole("link", {
      name: "See more about my experience",
    });
    expect(
      await link.evaluate(
        (el) => getComputedStyle(el, "::after").animationName,
      ),
    ).toBe("underline-draw");
    expect(
      await link.evaluate((el) => getComputedStyle(el).borderTopWidth),
    ).toBe("0px");
    await link.click();
    await expect(page).toHaveURL(/\/experience$/);
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("the sphere sits below the text", async ({ page }) => {
    await openSkills(page);
    const outro = (await page.getByText(/Want to know more\?/).boundingBox())!;
    const sphere = (await page
      .getByRole("list", { name: "Skills" })
      .locator("..")
      .boundingBox())!;

    expect(sphere.y).toBeGreaterThan(outro.y + outro.height);
    await expect(words(page)).toHaveCount(34);
  });
});
