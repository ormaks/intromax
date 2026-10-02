# Spec: Stage 4h — Polish pass

## What

The last Stage 4 piece:

- TextSplit headings read as whole words to assistive tech.
- The unused `SITE_NAME` placeholder is removed from `modules/common`.
- e2e never reaches SoundCloud.

## Why

- **Headings:** Chrome's accessibility tree named every TextSplit heading letter by letter ("A b o u t m e"), so screen readers spelled out each page title.
- **`SITE_NAME`:** only proved the workspace linkage in Stage 1. Nothing imports it.
- **SoundCloud:** the About spec stubbed the widget itself, but every other spec that visited `/about` (header, shell, textSplit) loaded the real script. That made those runs depend on the network.

## Scope

**In scope:**

- TextSplit letter mode, and the e2e heading assertions that worked around it.
- `modules/common/src/index.ts`.
- A shared Playwright fixture file for the portfolio e2e.

**Out of scope (your call):**

- Code-tag spacing and a side-by-side visual pass: they look right as they are.
- Replaying Home's animations on resize.
- `tailwind-merge`: the "complete variants" pattern stays.

## Approach

- **TextSplit letter mode:**
  - The letters render inside an `aria-hidden` wrapper, next to an `sr-only` copy of the whole text.
  - A heading's accessible name then comes from that one copy.
  - Word mode and link mode are unchanged. Their words are already real text with real spaces.
- **e2e headings:** assert `getByRole("heading", { level: 1, name })` with the exact name. Text matching (`main h1`) is no longer needed.
- **`e2e/fixtures.ts`:**
  - Exports `test` (Playwright's, extended) and `expect`.
  - An automatic fixture routes `w.soundcloud.com/player/api.js` and the widget iframe to a fake Widget API (moved out of `about.spec.ts`).
  - A `soundCloud` option (`ready` | `blocked` | `no-sound`) covers the player's fallback tests through `test.use`.
  - Every spec imports `test`/`expect` from `./fixtures`.

## Acceptance criteria

- [x] Chrome's accessibility tree names the headings "Hi, I'm Maks, frontend developer.", "About me", "Skills & Experience", "Contact me" and "404 - Page not found", each read once, at 1440px and 375px
- [x] The letter bounce on hover still works
- [x] `SITE_NAME` is gone and `PetProject` stays
- [x] A full e2e run makes no request to `soundcloud.com`
- [x] Lint, typecheck (portfolio, `modules/common`) and the full e2e suite pass

## Deviations

- **"Clicking a chip pulses through its group" (Skills e2e) was flaky under full-suite load.**
  - It polled for a swell that lasts a fraction of a second, so the polling sometimes missed it.
  - It now samples every frame in the page for 3s after the click.
