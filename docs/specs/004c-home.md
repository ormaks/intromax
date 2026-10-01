# Spec: Stage 4c — Home page

## What

The Home page, rebuilt to match the legacy site:

- **Left:** the three-line heading, the monospace subtitle and the CONTACT ME button.
- **Right:** the wolf and the "Ormaks" wordmark. The wordmark draws itself in with GSAP DrawSVG, then flickers on a neon loop. A very faint mirrored copy sits beneath it, like a reflection.
- **Content:** new copy.

## Why

Home is the first impression and holds most of the site's signature visuals. Every piece it depends on is in place by then: the shell (004a) and the Wolf SVG (004b).

## Scope

**In scope:**

- `gsap` dependency in the portfolio app only. `@gsap/react` too, for `useGSAP`, which cleans up animations on navigation.
- `Wordmark` component: "Ormaks" converted to outlined shapes from DancingScript Regular, with the draw-in, blink and mirror copy.
- Wolf draw-in on Home.
- Animation starts on the preloader's "done" signal (004a).
- Reduced motion: no special version (see Approach).
- Desktop, tablet and mobile layouts.
- New Home copy.

**Out of scope:**

- The header wolf, which only spins (004b).
- Any other page using GSAP. The sphere decision is round 2.
- Changing the CONTACT ME destination (`/contact`).

## Approach

**Dependencies**: add `gsap` and `@gsap/react` to `apps/portfolio`, a new dependency flagged per AGENTS.md. DrawSVG ships in the public `gsap` package since GSAP became free (2025). Import it from `gsap/DrawSVGPlugin` and register it once in the client component.

**Wordmark shapes**: a throwaway script in the session's scratch folder (using `opentype.js`, installed there, not in the repo) converts "Ormaks" set in DancingScript Regular into path data.

- Legacy used the regular weight (`font-weight` unset).
- DancingScript is under the Open Font License (OFL), so outlining is allowed.
- Result: `apps/portfolio/components/wordmark/Wordmark.tsx`, one `<path>` per glyph, with `fill` and `stroke` set through props and classes.
- The component is decorative (`aria-hidden`); the page's heading carries the meaning.
- DancingScript stays loaded, because the header still uses it as a live font.

**Right side, desktop (from legacy `home.scss`):**

- **Container:** anchored at the right edge (legacy `right: -123px`, so it deliberately runs past the viewport edge).
- **Wolf:** original size (208×286), accent colour, placed as legacy (`right: 145px; top: 30px` within the container).
- **Wordmark:**
  - Box 759×286, `margin-top: 155px`, rotated 45°.
  - Glyphs 250px, fill `#222324`, stroke accent.
  - Glow: legacy asks for `text-shadow: -1px 0 28px #08fdd842`, and `text-shadow` on SVG text isn't reliable across browsers. Reproduce the visible result with `filter: drop-shadow(...)`. Include the glow only if it matches in the side-by-side comparison; drop it if it reads as a change. This is a side-by-side call, noted in the PR.
- **Mirror copy:**
  - Box 713×224, `top: 314px; right: 156px`, `transform: rotate(-135deg) rotateY(180deg)`, `blur(2px)`.
  - Fill `rgba(37,38,39,.5)`, stroke `rgba(8,253,216,.04)`. "Very low opacity", exactly as legacy.
  - Runs the same draw and blink animation as the main wordmark.

**Animation** (client component, using `useGSAP` scoped to the Home right side):

- **Waits** until `usePreloaderDone()` reports done (004a) before the timeline starts.
  - First load: after the loader clears.
  - Client-side navigation back to Home: the loader shows again for 1.5s, then the timeline starts.
- **Wordmark draw:** `drawSVG: "0%" → "100%"` over 4s, linear. Fill opacity stays 0 until 80% of the draw, then rises to 1 by 100%.
  - Legacy `dash` runs `alternate both` with no repeat, so it plays once.
  - Applied to both the main and mirror copies.
- **Neon blink:** starts with the draw and runs forever on a 5s loop. Opacity keyframes copied from legacy `neonBlink`: 0% 1, 10% .6, 12% 1, 15% .4, 17% 1, 18% .3, 19% 1, 29% 1, 30% .9, 33% 1, 89% 1, 91% .7, 94% 1.
  - Implemented as a GSAP `keyframes` tween with `repeat: -1`, so it can be killed on unmount with everything else.
- **Wolf draw:** strokes draw in over ~3s, in parallel with the wordmark, top to bottom. Each filled part (forehead, eyes, nose) fades in as the strokes around it draw, not at the end.
  - This timing is new: the legacy wolf wasn't animated. Tune it in review.
- **Reduced motion** (`prefers-reduced-motion: reduce`, checked via `gsap.matchMedia()`): no exception. The site is animation-first, so everything animates for everyone, the blink included. This is a deliberate call, made knowing the flicker is close to WCAG's three-flashes-per-second limit.
- **Server render:** everything is fully drawn by default. The animation hides the strokes once it knows it will run, so visitors without JavaScript and search crawlers see the finished image.
  - Hiding before the first paint is safe because the preloader covers the page at that moment.

**Left side (from legacy `home.scss`):**

- Positioned via `PageShell` (004a).
- Content block indented 6% on desktop, 9% on tablet, 13% on mobile.
- `<h1>` code tags above and below (`CodeTag`).
- Heading: three `TextSplit` lines in white (Home is the only page whose heading is white).
- Subtitle as a `<p>`: monospace 11px, `#8d8d8d`, 1px tracking, no margin. `#8d8d8d` becomes the `--color-subtle` token (see Deviations).
- Button (`ButtonLink` to `/contact`):
  - 13px, 3px tracking, padding 8px 12px, `margin-top: 25px`, 0.7s transition, hover fills with accent.
  - Check `buttonClassName` against these values. Where the Contact SEND button differs (11px, 4px radius), give Home's a variant rather than changing the shared default. Contact is round 2.
  - On mobile: 10px text, padding 7px 10px.

**Tablet (481–1024):**

- Right side moves to the bottom, centred in a column.
- Wolf in normal flow.
- Wordmark **not rotated**, 232px tall, `margin-top: -100px`. No mirror copy.
- Page `min-height: 768px`.

**Mobile (≤480):**

- Wolf becomes a centred watermark at 80% width and **2% opacity**. It doesn't animate; drawing something nearly invisible is wasted work.
- Wordmark and mirror copy are hidden.
- Don't mount the wordmark on mobile at all, so no GSAP work runs for hidden elements. Use `gsap.matchMedia()` for this, not just `display: none`.

**Content**: copy goes inline in `app/page.tsx`. See Content (answered) below.

## Acceptance criteria

- [x] `gsap` and `@gsap/react` added to `apps/portfolio` only
- [x] Desktop: wolf, rotated wordmark and mirror copy sit where legacy has them (checked side by side at 1440)
- [x] Draw-in starts only after the preloader clears, on first load and on navigating back to Home
- [x] Wordmark: 4s draw-in, fill arrives over the last 20%, then the blink loops. Mirror copy does the same at legacy opacity
- [x] Wolf strokes draw in, with the forehead, eyes and nose fading in along the way
- [x] Reduced motion: everything animates, blink included
- [x] Without JavaScript: everything visible, fully drawn
- [x] Navigating away mid-animation: no console errors, no leftover tweens (checked via the `useGSAP` cleanup)
- [x] Tablet: unrotated wordmark under the wolf, no mirror. Mobile: 2%-opacity wolf watermark, no wordmark mounted
- [ ] Heading uses TextSplit with the hover bounce; subtitle and button match legacy type and spacing (see Deviations: shared code-tag spacing)
- [x] e2e: Home renders, the heading reads correctly, CONTACT ME navigates to `/contact`, and at 375px the wordmark isn't in the DOM
- [ ] Side-by-side screenshots (375/800/1440, including one mid-draw frame) in the PR
- [x] Lint, typecheck, build and e2e pass

## Content (answered)

1. **Heading:** "Hi," / "I'm Maks," / "frontend developer."
2. **Subtitle:** "React / TypeScript / Next.js". The role is already in the heading.
3. **Button:** "Contact me".
4. **Metadata:** the title stays the layout's "Ormaks — Maks Chytailo". Description: "Maks Chytailo, a frontend developer building with React, TypeScript and Next.js."
5. **Wolf timing:** in parallel with the wordmark, about 3s.

## Deviations during implementation

- **The glow is kept.** Checked against the live legacy site: Chrome does render its `text-shadow` on the SVG text, so the glow is part of the look. It's reproduced with `drop-shadow(-1px 0 28px …)` on the wordmark.
- **Wordmark geometry follows the legacy markup exactly.** Each copy is an SVG the size of its legacy box (759×286 main, 713×224 mirror), with the word centred on the legacy text origin (x 370 / y 195 and x 350 / y 200). The boxes measured identical to legacy at 1440. On tablet, the 232px-tall box crops rather than scales (`preserveAspectRatio="xMidYMin slice"`), as the unscaled legacy text did.
- **Mounting uses a `useMediaQuery` hook, not `gsap.matchMedia()`.** Mounting is React's job; GSAP only animates. The server renders everything, so no-JS visitors see it, and CSS hides the wordmark on mobile until hydration unmounts it. The hook lives in `apps/portfolio/hooks/`, and 4d reuses it for Instagram.
- **`PageShell` gained two props.**
  - `backdrop` renders the art inside the preloader, so it can wait on `usePreloaderDone()`, and behind the frame.
  - `inset` replaces the content margins as a whole, for Home's 13% mobile indent. `cn()` doesn't dedupe, so single margins can't be overridden.
- **Tablet art is bottom-anchored in a page at least 768px tall**, measured identical to legacy at 800×1024 (wolf top 606, wordmark top 792).
- **Button:** `buttonClassName` gained a `size` option. `responsive` is 10px text with 8/10px padding on mobile (Tailwind scale; legacy was 7/10px), stepping up to the default at tablet. Button text line-height is `normal` via the `text-button` token.
- **New tokens:** `--color-subtle` (#8d8d8d), `text-caption` (11px, 1px tracking) and `text-button-sm` (10px).
- **Spacing gap left for a shared fix:** the `<h1>` code tags are 25px tall (`text-tag` line-height 1.4) where legacy's are 33px (`normal`), and on tablet and mobile the content block starts about 20px higher. That puts the subtitle and button 4px higher than legacy on desktop and up to 33px higher on tablet. The cause is shared `CodeTag`/`PageShell` code, which affects every page, so it's not changed here.
- **The mirror's faint inset box-shadow is not reproduced**; it's invisible at that alpha.
