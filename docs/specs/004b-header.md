# Spec: Stage 4b — Header fidelity

## What

Rebuild the Header to match the legacy site across all three layouts: the 55px side rail on desktop, a 60px top bar with visible links on tablet, and a burger menu with slide-in rows on mobile. It uses the legacy Font Awesome icons and the spinning wolf logo, now an SVG.

## Why

The Stage 2 Header is a functional stand-in: text labels, one 640px switch, a generic mobile panel. The header is on every page, so its fidelity gap shows everywhere. The wolf SVG built here is also needed by Home (004c).

## Scope

**In scope:**
- Seven icon components (Font Awesome Free SVGs): house, user (regular), gear, envelope (regular), facebook-f, instagram, telegram
- Three layouts at the 004a breakpoints (≤480, 481–1024, >1024)
- Nav hover/active behavior, logo spin, burger morph and slide-ins
- `Wolf` SVG component (centerline-traced line art), used here and by 004c

**Out of scope:**
- Wolf draw-in animation (004c; this spec only guarantees the SVG is built from strokes that can be drawn)
- New nav items or links (Works/Lab, a language switcher — not now)
- Changing the social URLs

## Approach

**Icons**: `apps/portfolio/components/icons/`. There's one `Icons.tsx` exporting seven small components plus `index.ts`. It's one folder because they are one set, and seven single-file folders would be noise. This is a small, deliberate deviation from one-folder-per-component, documented in the file.
- Paths are copied from Font Awesome Free 6. The legacy site used FA5; the FA6 equivalents are `house`, `user` regular, `gear`, `envelope` regular and the three brands, which are visually the same at these sizes.
- The header comment carries the **CC BY 4.0** attribution the icon licence requires.
- Each icon takes `className`, uses `fill="currentColor"`, and is `aria-hidden`. The accessible name stays on the link.
- No dependency.

**Wolf**: `apps/portfolio/components/wolf/Wolf.tsx`.
- An inline SVG of the legacy `Wolf2.png` line art, redrawn as **stroked paths along the centre of each line**: `fill="none"`, `stroke="currentColor"`, round joins. That is what lets DrawSVG draw it in 004c without doubled edges.
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
    - On hover: the link widens to 65px (0.3s), and icon and label turn accent with the label at opacity 1.
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
- `#949292` is used once, so it's an arbitrary value with a comment.

**Layout offset**: `app/layout.tsx`'s `main` clears the rail with `desktop:pl-(--width-header)`. 004a already adds the 60px top padding below 1025px.

## Acceptance criteria

- [ ] Desktop: rail matches legacy side by side. Wolf spins on the 15s cycle, nav labels hidden until hover or active, hover widens to 65px, socials at the bottom
- [ ] Tablet (800px): horizontal 60px bar with visible nav and socials, no burger
- [ ] Mobile (375px): centred accent "Ormaks", burger morphs to an accent ✕, nav row and socials slide in, text fades
- [ ] Burger: `aria-expanded` correct, closes on route change and on Escape
- [ ] Every nav and social link has an accessible name; icons are `aria-hidden`
- [ ] `Wolf` renders crisp at 55px and at 300px+, built from stroked paths (`fill="none"`, apart from the small eye/nose shapes)
- [ ] Icons file carries the Font Awesome CC BY 4.0 attribution
- [ ] e2e: add burger open/close and nav-activation smoke tests at 375px; the rail and top-bar layouts render at 1440 and 800
- [ ] Side-by-side screenshots (375/800/1440, including hover and the open burger) in the PR
- [ ] Lint, typecheck, build and e2e pass

## Open questions

- **Who traces the wolf?** No centerline-tracing tool is installed on this machine. Options:
  - (a) You trace `Wolf2.png` in Inkscape (Trace Bitmap → Centerline) and hand me the SVG. I'll clean it up and convert it into the component.
  - (b) I install `autotrace` locally (a machine-level download outside the repo, needs your OK) and trace it myself. Quality may need hand-editing.
  - (c) I redraw it by hand as polylines from the PNG. It's geometric line art, so this is feasible, but slowest.
  - My recommendation is (a) if you have Inkscape, otherwise (b).
