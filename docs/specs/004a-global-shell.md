# Spec: Stage 4a — Global shell (layout, global styles, preloader, e2e)

## What

The site-wide frame every Stage 4 page sits in: legacy breakpoints, the non-scrolling desktop page layout, the `<body>`/`</body></html>` code-tag frame, legacy global styles (cursor, selection, fonts), the preloader reworked to run on every navigation, the legacy favicon — plus Playwright set up with smoke tests so "e2e must pass" has something to run.

## Why

Home (004c) and About (004d) both depend on this frame, and the header (004b) depends on the breakpoints. Doing it once, first, keeps the page PRs about their pages. Decisions come from the Stage 4 round-1 discussion; the audit behind them is summarized in `docs/legacy-audit.md` (updated by this spec).

## Scope

**In scope:**
- Playwright (`@playwright/test`, app-local devDependency) + `e2e` script/Nx target + smoke tests
- Breakpoint tokens matching the legacy three layouts; migrate existing `sm:`/`xs:` usages
- `PageShell` component: non-scroll desktop layout with a short-viewport scroll fallback, code-tag frame, per-page preloader
- Preloader rework: every navigation, fixed 1.5s, "done" signal, visual drift fixes
- Global styles: custom cursor, `user-select: none`, `:focus-visible` ring, monospace prose / Open Sans buttons
- `CodeTag` closing form confirmed as `</h1>` (already correct — no change beyond verifying)
- Favicon + apple-touch-icon from the legacy `favicon.png`
- Delete `tempsitc.ttf` and its `--font-logo-alt` token
- Docs: `legacy-audit.md` corrections, `AGENTS.md` (breakpoints, e2e command, `PageShell` convention)

**Out of scope:**
- Header visuals/behavior — 004b (this spec only swaps its breakpoint prefixes so nothing breaks)
- Any page's real content or page-specific layout — 004c/004d
- Visual snapshot tests (`toHaveScreenshot`) — end of Stage 4
- Skills/Contact/NotFound fidelity — round 2 (they get wrapped in `PageShell` only so the frame is consistent; NotFound is *not* wrapped)
- Font licensing for Millunium — Stage 6

## Approach

**1. Playwright.** Add `@playwright/test` to `apps/portfolio` devDependencies (new dependency — the e2e tool AGENTS.md already names). `playwright.config.ts` at the app root, Chromium only, `webServer` running `next build && next start` on a fixed port (production build — dev-mode overlays and HMR make smoke tests flaky). Tests in `apps/portfolio/e2e/`. Script `"e2e": "playwright test"`; add an `e2e` entry to `nx.json` `targetDefaults` with `cache: false` and `dependsOn: []`. Browser binaries are installed with `pnpm exec playwright install chromium` — a one-off download (~150MB) outside the repo, flagged for approval before running. Add `test-results/`, `playwright-report/` to `.gitignore`.

Smoke tests (grow with each later spec):
- `/`, `/about`, `/skills`, `/contact` return 200, render their `<h1>`, and the preloader is gone within 3s
- an unknown path renders the custom 404 (not Next's default) and shows **no** preloader
- clicking a nav link navigates client-side and the preloader shows again, then clears
- the code-tag frame is present and `aria-hidden`
- at 1440×900 the document does not scroll; at 1440×500 it does

**2. Breakpoints.** In `theme.css`, reset Tailwind's defaults (`--breakpoint-*: initial`) and declare only the legacy ones, so nobody reaches for a `md:` that means nothing here:
- `--breakpoint-tablet: 30.0625rem` (481px — legacy tablet starts at 481)
- `--breakpoint-desktop: 64.0625rem` (1025px — legacy desktop is >1024)

Mobile-first as usual: unprefixed = ≤480. Replace existing `xs:` (heading step, currently 480px — off by one vs legacy) with `tablet:`, and the Header/layout `sm:` (640px) with `desktop:`. At this stage the Header just keeps its current look, switching at 1025 instead of 640; 004b rebuilds it.

**3. `PageShell`** (`apps/portfolio/components/pageShell/`) — wraps each route's content (Home, About, Skills, Contact; **not** NotFound):
- renders `<Preloader />` (see 4) — this is how the preloader runs "on every navigation": pages remount when the route changes, as in the legacy site where each page component mounted its own loader. **Deviation from the discussion's `app/template.tsx` idea**, deliberately: a root template would also wrap the global 404, which must have no preloader, and moving the 404 into a route group is already proven to break it (Stage 2). Per-page is also exactly what the legacy did.
- the code-tag frame: `<body>` top-left, `</body>` + `</html>` bottom-left, via `CodeTag` (LaBelleAurore 18px, `text-muted`, indented 5px mobile / 10px tablet / 30px desktop — legacy `main.scss`)
- desktop layout: page area positioned `top: 5%`, `height: 90%` of the viewport right of the rail, `min-height: 566px`, frame tags pinned top/bottom with content between (flex column, `justify-between`) — the legacy geometry, built with flex instead of `position: absolute` stacking
- tablet/mobile: normal flow, top padding clearing the fixed 60px header bar (the bar itself arrives in 004b; the padding lands here so pages are right from the start)

**Non-scroll rule** in `globals.css`: `@media (min-width: 1025px) and (min-height: 596px) { html, body { overflow: hidden; } }`. Shorter viewports scroll instead of clipping — the escape hatch agreed in discussion. 596px is where the legacy `top: 5%` + `min-height: 566px` page still fits (see Deviations).

**4. Preloader rework** (`components/preloader/`):
- Visible from the server render (with the `<noscript>` escape), hidden once **both** 1.5s have elapsed since mount **and** `document.readyState === "complete"` — on client navigations the document is already complete, so that reduces to a flat 1.5s; on first load it is `max(load, 1.5s)`, capped at 5s so a hung subresource can't trap the site behind the loader.
- Overlays the page (`fixed`, above content, below toasts) — the page underneath stays mounted, so About's iframes load behind it.
- "Done" signal: React context provided by `Preloader` (which wraps the page), read with `usePreloaderDone()`. Consumers (004c's draw-in) wait on it. App-local — nothing outside the portfolio needs it. (Originally planned as a module store — see Deviations.)
- Moved out of `app/layout.tsx` into `PageShell`.
- Visual fixes against legacy `preloader.scss`: label in monospace 13px, letter-spacing 2px, `text-shadow: 0 0 2px accent`, fade-up 0.5s; progress track `#55708d`, bar width 30vw, 3px tall, glowing tip (`box-shadow` accent) ; cube 75px. `#55708d` is single-use → arbitrary value with a comment, not a token.
- The loader itself is `role="status"` with an accessible name. (`aria-busy` on the page region was dropped — see Deviations.)

**5. Global styles** (`globals.css` + `theme.css`):
- Cursor: convert legacy `cursor.cur` (32×32, hotspot 7,7) to `public/cursor.png` with a one-off script in the session scratchpad (`sharp`, already present via Next) — only the PNG enters the repo. `*, *::before, *::after { cursor: url(/cursor.png) 7 7, pointer !important; }` — applies to inputs too (decided). Wrapped so `@media (forced-colors: active)` falls back to system cursors.
- `body { user-select: none; }` (decided — kept from legacy). Form fields remain editable/selectable (browser default inside inputs).
- `:focus-visible { outline: 1px solid var(--color-accent); outline-offset: 2px; }` — keyboard only; mouse users see what legacy showed.
- Fonts: body default becomes `font-mono` (Tailwind's default `ui-monospace, …, Consolas, …, monospace` stack — no new token needed). `--font-sans` stays Open Sans and is applied only where legacy asked for it: `buttonClassName` in `modules/ui` gets an explicit `font-sans`. Prose size 12px/18px desktop, 16px/19px + 1px tracking below 1025 — added as a `prose` text token pair in `theme.css` (`--text-prose`, `--text-prose-lg`) since About, Skills, Contact all use it.

**6. Favicon.** Generate `public/favicon.ico` (16/32/48) and `public/apple-touch-icon.png` (180px) from legacy `favicon.png` via a scratchpad script; replace the create-next-app default. Wire `icons` in root `metadata`.

**7. tempsitc.** Delete `modules/config/tailwind/fonts/tempsitc.ttf`, the `--font-logo-alt` token, and the comments in `theme.css`/`fonts.ts` that point at it. Grep confirms no other reference first.

**8. Docs.** `legacy-audit.md`: breakpoints, preloader timing, fonts-as-rendered, tempsitc dead, wordmark-is-live-text, new colors (`#fe0853`, `#55708d`, `#8d8d8d`, `#949292`), the leaked Maps key note. `AGENTS.md`: breakpoints convention, `pnpm nx e2e portfolio` is real now, `PageShell` wraps every route except NotFound.

## Acceptance criteria

- [ ] `pnpm nx e2e portfolio` runs the smoke suite green against a production build
- [ ] Only `tablet:` (481) and `desktop:` (1025) breakpoints exist; no `sm:`/`md:`/`xs:` left in app or `modules/ui`
- [ ] At 1440×900 no page scrolls; at 1440×500 the page scrolls; at 800 and 375 wide pages scroll normally
- [ ] `<body>` and `</body></html>` frame renders on Home/About/Skills/Contact, not on 404; all tags `aria-hidden`
- [ ] Preloader shows on first load until `max(load, 1.5s)` (capped at 5s), and for 1.5s on each client-side navigation between pages; never on 404
- [ ] `usePreloaderDone()` is true exactly when the overlay leaves
- [ ] Custom cursor shows everywhere including inputs; text is not selectable; keyboard focus shows an accent ring, mouse clicks don't
- [ ] Prose renders in the system monospace stack; buttons in Open Sans
- [ ] Legacy wolf favicon in the tab; no create-next-app favicon left
- [ ] `tempsitc.ttf` and `--font-logo-alt` gone, build unaffected
- [ ] Side-by-side screenshots (375/800/1440, legacy vs local) of the preloader and the frame in the PR
- [ ] Lint, typecheck, build, e2e pass

## Deviations during implementation

- **"Done" signal is React context, not a module store.** `Preloader` wraps the page (`<Preloader>{children}</Preloader>`) and provides `usePreloaderDone()`. A module-level store has an ordering bug: a page rendered after navigation reads the *previous* page's "done = true" during its first render, before the new Preloader's effect can reset it — Home would start its draw-in behind the loader. Context is correct from the first render.
- **Non-scroll threshold is 596px tall, not 566px.** The page area is `top: 5%` + at least 566px, which only fits a viewport ≥ ~596px (566 + 5%·596). Locking scroll from 566 up would clip 0–30px on 566–595px viewports.
- **Mobile/tablet top padding for the fixed header bar is deferred to 004b.** The current (Stage 2) header is still in-flow below desktop, so adding the 60px offset now would double the gap. 004b makes the bar fixed and adds the offset in the same change.
- **Playwright runs on the installed Chrome** (`channel: "chrome"`). The Chromium download from `cdn.playwright.dev` timed out repeatedly on this machine. `PLAYWRIGHT_CHANNEL=""` switches back to the bundled browser for CI.
- **No `aria-busy` on the page region.** `Preloader` renders the page as plain children with no wrapper element, and adding one just to carry `aria-busy` would put a layout-affecting box (or a `display: contents` box, whose ARIA support is unreliable) around every page. The overlay's `role="status"` already announces loading.
- **5s cap on the first-load wait** (review finding): `load` waits on every subresource, so without a cap a hung request would keep the site behind the loader forever.
- **`Text`'s `body` variant changed** (`modules/ui`) to the monospace prose style (16px/19px/1px tracking, 12px/18px on desktop), rather than adding a new variant: every current `Text` body usage is page prose.

## Open questions

- Approve downloading Playwright's Chromium (~150MB, machine-local) when implementation reaches that step.
- If Next's root layout turns out *not* to remount per-page components on navigation in some edge (e.g. same-page link), that matches legacy (react-router didn't remount either) — flag only if something else surprises.
