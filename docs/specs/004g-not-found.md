# Spec: Stage 4g — 404 page

## What

The 404 page as a small scene: a sphere of linked dots that has **fallen apart**, lying scattered under a glitching "404". Reaching for the way home (hover or focus "Take me home") pulls the dots back into a spinning sphere.

## Why

The 404 is the last Stage 4 page, still a placeholder. The scene reuses the preloader's constellation, so the "missing" page reads as the site's own visual language breaking and repairing itself.

## Scope

**In scope:**

- A shared `Constellation` (moved out of the preloader) with an `assembled` amount.
- `NotFoundScene`, the glitch heading, the home link, and the page metadata.

**Out of scope:**

- Suggestions or search on the 404.

## Approach

- **`components/constellation/`:** the preloader's dot sphere, now with `assembled` (0-1, default 1).
  - At 0, the dots rest at fixed scattered spots and drift gently, with no links.
  - As the value rises, they fly back into the spinning sphere and the links fade in.
  - The canvas eases toward whatever value it's given.
  - The preloader uses the default (fully assembled).
- **`components/notFoundScene/`:**
  - The constellation sits above an `h1` whose accessible name is "404 - Page not found". Visually it's a glitching "404" with "Page not found" under it.
  - Below that, "Take me home" (a TextSplit link to `/`).
  - Hovering or focusing the link assembles the sphere; leaving scatters it.
  - Without hover (touch), it assembles and scatters on a 2.6s loop.
- **Glitch:** CSS keyframes in `globals.css`.
  - The text scales for a frame now and then.
  - Red (`#fe0853`) and blue (`#3b6cff`) copies (`::before`/`::after` from `data-text`) jitter on and off.
  - The colours are single-use, so they stay arbitrary values.
- **Frame:** no `PageShell`, so no preloader or code-tag frame. Content is centred in the viewport (minus the header bar below desktop) and fits without scrolling.

## Acceptance criteria

- [x] Unknown paths return 404 with the heading "404 - Page not found" and a "Take me home" link to `/`
- [x] The dots are scattered at rest and assemble into the linked sphere on hover/focus of the link, then scatter again
- [x] On touch, the sphere assembles and scatters on its own loop
- [x] The 404 glitches (scale flicker plus red/blue offset copies)
- [x] No preloader or frame; no scroll at 1440×900 or 375×667
- [x] The preloader still shows the assembled constellation
- [x] e2e covers the above; lint, typecheck, build and e2e pass

## Content

- **Heading:** "404" / "Page not found"; accessible name "404 - Page not found".
- **Link:** "Take me home".
- **Metadata:** title "Page not found - Ormaks".
