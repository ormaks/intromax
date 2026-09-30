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
- Reduced-motion versions.
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
  - Glow: legacy asks for `text-shadow: -1px 0 28px #08fdd842`, but Chrome ignores `text-shadow` on SVG. Reproduce the visible result with `filter: drop-shadow(...)`. Include the glow only if it matches in the side-by-side comparison; drop it if it reads as a change. This is a side-by-side call, noted in the PR.
- **Mirror copy:**
  - Box 713×224, `top: 314px; right: 156px`, `transform: rotate(-135deg) rotateY(180deg)`, `blur(2px)`.
  - Fill `rgba(37,38,39,.5)`, stroke `rgba(8,253,216,.04)`. "Very low opacity", exactly as legacy.
  - Runs the same draw and blink animation as the main wordmark.

**Animation** (client component, using `useGSAP` scoped to the Home right side):

- **Waits** until `preloaderStore` reports done (004a) before the timeline starts.
  - First load: after the loader clears.
  - Client-side navigation back to Home: the loader shows again for 1.5s, then the timeline starts.
- **Wordmark draw:** `drawSVG: "0%" → "100%"` over 5s, linear. Fill opacity stays 0 until 80% of the draw, then rises to 1 by 100%.
  - Legacy `dash` runs `alternate both` with no repeat, so it plays once.
  - Applied to both the main and mirror copies.
- **Neon blink:** starts with the draw and runs forever on a 5s loop. Opacity keyframes copied from legacy `neonBlink`: 0% 1, 10% .6, 12% 1, 15% .4, 17% 1, 18% .3, 19% 1, 29% 1, 30% .9, 33% 1, 89% 1, 91% .7, 94% 1.
  - Implemented as a GSAP `keyframes` tween with `repeat: -1`, so it can be killed on unmount with everything else.
- **Wolf draw:** strokes draw in over ~2.5s, in parallel with the wordmark, then the eye and nose shapes fade in (0.3s).
  - This timing is new: the legacy wolf wasn't animated. Tune it in review.
- **Reduced motion** (`prefers-reduced-motion: reduce`, checked via `gsap.matchMedia()`): everything renders fully drawn, with no blink. This avoids the flicker, which is close to WCAG's three-flashes-per-second limit.
- **Server render:** everything is fully drawn by default. The animation hides the strokes once it knows it will run, so visitors without JavaScript and search crawlers see the finished image.
  - Hiding before the first paint is safe because the preloader covers the page at that moment.

**Left side (from legacy `home.scss`):**

- Positioned via `PageShell` (004a).
- Content block indented 6% on desktop, 9% on tablet, 13% on mobile.
- `<h1>` code tags above and below (`CodeTag`).
- Heading: three `TextSplit` lines in white (Home is the only page whose heading is white).
- Subtitle as a `<p>`: monospace 11px, `#8d8d8d`, 1px tracking, no margin. `#8d8d8d` is used once, so it's an arbitrary value with a comment.
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

**Content**: copy goes inline in `app/page.tsx`. Filled from your answers to the questionnaire below; I draft, you edit.

## Acceptance criteria

- [ ] `gsap` and `@gsap/react` added to `apps/portfolio` only
- [ ] Desktop: wolf, rotated wordmark and mirror copy sit where legacy has them (checked side by side at 1440)
- [ ] Draw-in starts only after the preloader clears, on first load and on navigating back to Home
- [ ] Wordmark: 5s draw-in, fill arrives over the last 20%, then the blink loops. Mirror copy does the same at legacy opacity
- [ ] Wolf strokes draw in, then the eyes and nose fade in
- [ ] Reduced motion: everything fully drawn, no blink
- [ ] Without JavaScript: everything visible, fully drawn
- [ ] Navigating away mid-animation: no console errors, no leftover tweens (checked via the `useGSAP` cleanup)
- [ ] Tablet: unrotated wordmark under the wolf, no mirror. Mobile: 2%-opacity wolf watermark, no wordmark mounted
- [ ] Heading uses TextSplit with the hover bounce; subtitle and button match legacy type and spacing
- [ ] e2e: Home renders, the heading reads correctly, CONTACT ME navigates to `/contact`, and at 375px the wordmark isn't in the DOM
- [ ] Side-by-side screenshots (375/800/1440, including one mid-draw frame) in the PR
- [ ] Lint, typecheck, build and e2e pass

## Open questions — content questionnaire (please answer before implementation)

1. **Heading lines.** Legacy: "Hi," / "I'm Maks," / "web developer." Keep, or change the third line (e.g. "frontend developer.")? Three short lines fit the layout; a fourth fits at a squeeze.
2. **Subtitle.** Legacy: "Front End Developer / React / Angular". What should it say now? It's a short, slash-separated line, e.g. "Frontend Developer / React / TypeScript / Next.js".
3. **Button label.** Keep "Contact me"?
4. **Metadata.** Page title (currently the layout's "Ormaks — Maks Chytailo") and a one-sentence description for search results and link previews.
5. **Wolf draw timing.** Is ~2.5s alongside the wordmark fine, or should the wolf draw _first_, with the wordmark following?
