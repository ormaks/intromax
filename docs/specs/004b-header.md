# Spec: Stage 4b — Header fidelity

## What

Rebuild the Header to match the legacy site across all three layouts: the 55px side rail on desktop, a 60px top bar with visible links on tablet, and a burger menu with slide-in rows on mobile. It uses the legacy Font Awesome icons and the spinning wolf logo, now an SVG.

## Why

The Stage 2 Header is a functional stand-in: text labels, one 640px switch, a generic mobile panel. The header is on every page, so its fidelity gap shows everywhere. The wolf SVG built here is also needed by Home (004c).

## Scope

**In scope:**

- Seven icon components (Font Awesome Free SVGs): house (regular), user (regular), gear, envelope (regular), facebook-f, instagram, telegram
- Three layouts at the 004a breakpoints (≤480, 481–1024, >1024)
- Nav hover/active behavior, logo spin, burger morph and slide-ins
- `Wolf` SVG component (centerline-traced line art), used here and by 004c

**Out of scope:**

- Wolf draw-in animation (004c; this spec only guarantees the SVG is built from strokes that can be drawn)
- New nav items or links (Works/Lab, a language switcher — not now)
- Changing the social URLs

## Approach

**Icons**: `apps/portfolio/components/icons/`. There's one `Icons.tsx` exporting seven small components plus `index.ts`. It's one folder because they are one set, and seven single-file folders would be noise. This is a small, deliberate deviation from one-folder-per-component, documented in the file.

- Paths are copied from Font Awesome Free 7 (see Deviations). The legacy site used FA5; the current equivalents are `house` regular, `user` regular, `gear`, `envelope` regular and the three brands, which look the same at these sizes.
- The header comment carries the **CC BY 4.0** attribution the icon licence requires.
- Each icon takes `className`, uses `fill="currentColor"`, and is `aria-hidden`. The accessible name stays on the link.
- No dependency.

**Wolf**: `apps/portfolio/components/wolf/Wolf.tsx`.

- An inline SVG of the legacy `Wolf2.png` line art, redrawn as **stroked paths along the centre of each line**: `fill="none"`, `stroke="currentColor"`, mitred joins (sharp corners, as asked) with round caps so lines meet cleanly at junctions. That is what lets DrawSVG draw it in 004c without doubled edges.
- Accepts `className` and forwards a ref to the `<svg>` so 004c can target its paths.
- Tracing happens outside the repo (see Open questions); only the resulting path data is committed.
- The eyes and nose are filled shapes in the original. They stay as small filled paths, and 004c fades them in after the stroke draws.

**Header layouts** (reference: legacy `header.scss`):

- **Desktop (>1024), side rail:**
  - Fixed left, 55px wide, full height with `min-height: 400px`, background `surface`.
  - **Logo** (top): Wolf at 55px tall, in the accent colour.
    - Legacy `App-logo-spin`: a 15s infinite ease-in-out loop running 0°→10° (2%) → −35° (6%) → 360° (8%), then resting. CSS keyframes, no GSAP needed.
    - Below the Wolf, "Ormaks" in `font-logo` 18px, `#949292`, `text-shadow: 0 0 1px accent`.
  - **Nav** (middle): a 300px-tall column, links spaced evenly.
    - Each link: icon 22px in `border` colour; below it an 8px uppercase label in the accent colour at `opacity: 0`.
    - On hover: the link widens to 64px (0.3s; legacy 65px, see Deviations), and icon and label turn accent with the label at opacity 1.
    - Active page: icon accent, label visible. Keep Stage 2's prefix-aware `isActive`.
  - **Socials** (bottom): 15px icons in `border` colour, turning accent on hover, opening in a new tab with `rel="noopener noreferrer"`.
- **Tablet (481–1024), top bar:**
  - Fixed top, 60px tall, full width, in a row: logo (Wolf 45px + wordmark), the nav as a 400px-wide row of the same icon/label links (no widening on hover), and the socials row.
  - No burger. `overflow: hidden` as legacy.
- **Mobile (≤480), top bar with burger:**
  - Fixed 60px bar.
  - "Ormaks" centred (legacy `left: 37%`, `top: 9px`), `font-logo` 31px, 2.5px tracking, accent.
  - **Burger**: a 50px-wide button at the right edge.
    - Closed: three 4px bars in `border` colour.
    - Open: the outer bars shrink to 0 width and the middle bar pair rotates into an accent ✕, with legacy 0.2s timings and delays. CSS only.
  - **When open:**
    - The nav row (55px tall, `surface` background) slides from `left: 100%` to `0` just under the bar (0.3s linear).
    - The socials slide into the bar's centre (`left: calc(50% - 90px)`).
    - The "Ormaks" text fades out.
  - Keep the Stage 2 behaviour: `aria-expanded`/`aria-controls` on the button, closes on route change, and closes on Escape (add it if missing).

**Structure:**

- `BurgerMenu.tsx` stays as the burger button.
- Header state is lifted as needed.
- Use `cn(...)` for every conditional class, per AGENTS.md.
- `#949292` becomes the `--color-wordmark` token (see Deviations).

**Layout offset**: `app/layout.tsx`'s `main` clears the rail with `desktop:pl-(--width-header)`. Below 1025px it clears the fixed 60px bar with `pt-(--height-header)` (deferred from 004a, see Deviations).

## Acceptance criteria

- [ ] Desktop: rail matches legacy side by side. Wolf spins on the 15s cycle, nav labels hidden until hover or active, hover widens to 64px, socials at the bottom
- [x] Tablet (800px): horizontal 60px bar with visible nav and socials, no burger
- [x] Mobile (375px): centred accent "Ormaks", burger morphs to an accent ✕, nav row and socials slide in, text fades
- [x] Burger: `aria-expanded` correct, closes on route change and on Escape
- [x] Every nav and social link has an accessible name; icons are `aria-hidden`
- [ ] `Wolf` renders crisp at 55px and at 300px+, built from stroked paths (`fill="none"`, apart from the small eye/nose shapes)
- [x] Icons file carries the Font Awesome CC BY 4.0 attribution
- [x] e2e: add burger open/close and nav-activation smoke tests at 375px; the rail and top-bar layouts render at 1440 and 800
- [ ] Side-by-side screenshots (375/800/1440, including hover and the open burger) in the PR
- [x] Lint, typecheck, build and e2e pass

## Deviations during implementation

- **Wolf traced by a throwaway script, not Inkscape or autotrace** (you asked me to do it myself, with straight, sharp lines). A scratch-folder Node script, never committed, did the tracing:
  - It separated the filled shapes from the lines, thinned the lines to their centres, followed them into a graph of junctions and segments, and simplified each run into straight segments.
  - It then welded near-duplicate vertices, mirrored the left half so the mark is **exactly symmetric** about x = 103.5, and I corrected about ten vertices by hand: the forehead's five-point shape, almond eyes, jaw lines straight to the chin, a single point under the nose.
  - Result: 96 polylines plus 4 filled shapes, checked by overlaying on the source PNG. Lines are ordered top to bottom in mirror pairs for 004c's staggered draw-in, and tagged `data-wolf-line` / `data-wolf-shape`.
- **Font Awesome Free 7, not 6.** 7 is current; the licence is the same (CC BY 4.0). Its Telegram icon is only the plane in a circle (the plane-only variant is now an alias of it), which is Telegram's current official mark.
- **Header links use `next/link` directly, not `@intromax/ui`'s `Link`.** That component carries its own `hover:text-foreground`. `cn` only concatenates class names, so the header's `hover:text-accent` lost to whichever utility Tailwind emits later: hovered icons went white. The same issue made the burger's open state keep `w-full`, and a default `h-auto` collapse the wolf to 0×0. All three are fixed locally, and an e2e test now asserts the accent hover colour. **The underlying problem is systemic**: see the note in the PR about `tailwind-merge`.
- **New token `--height-header`** (60px) in `theme.css`, shared by the bar, the content offset in `layout.tsx` and the mobile nav's position. The 004a-deferred top offset lands here, as planned.
- **Closed mobile panels are `invisible` as well as off-screen**, so keyboard and screen-reader users can't reach hidden links. Visibility transitions with the slide, so it only switches off once the panel has left the screen.
- **Sizes follow the Tailwind spacing scale, not legacy pixels.** Where a legacy value sits a pixel off a scale step, the scale wins: hover tab 64px (legacy 65), nav column 288px (300), wolf 56px/44px (55/45), mobile nav row 56px (55), wordmark `top` 8px (9). The burger's internals land exactly on fractional steps (`h-7.5`, `top-3.25`, `w-12.5`, …), so it's unchanged. Still arbitrary, because they're specific: the wordmark's `left: 37%`, its tablet glow, and the `calc()` offsets for the mobile nav row and socials.
- **Header type and colour became theme tokens** rather than one-off arbitrary values: `text-label` (8px), `text-icon` (22px), `text-icon-sm` (15px), `text-logo` (31px, 2.5px tracking) and `--color-wordmark` (`#949292`, replacing the planned arbitrary value). `--font-sans-serif` (the platform's plain sans-serif) sets the 8px nav labels.
- **Home icon is Font Awesome's regular (outline) house**, matching the other regular nav icons, rather than the solid one.
- **Header wolf uses a heavier stroke** (`strokeWidth={3}` instead of the default 1.6). At 45-55px tall, the default would render well under a pixel wide.
- **Review fixes (`code-reviewer` pass):**
  - Escape returns focus to the burger.
  - The burger keeps a constant "Menu" label, with `aria-expanded` carrying the state.
  - The menu closes on any route change, including back/forward, and when the window grows past mobile width.
  - Focus rings are inset so the tablet bar doesn't clip them.
  - Labels and the desktop tab also appear on keyboard focus.
  - ~~Reduced motion zeroes transition delays.~~ Superseded: the site-wide reduced-motion override was removed. The site is animation-first and plays its animations whatever the OS setting.
  - `isActive` is segment-aware.

## Open questions

None — the wolf was traced in-house (see Deviations).
