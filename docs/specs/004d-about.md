# Spec: Stage 4d — About page

## What

The About page, rebuilt to match the legacy site:
- **Left:** the accent "About me" heading and the bio, animated word by word.
- **Right:** live Instagram and SoundCloud embeds. They load in the background behind a new reusable `Skeleton` placeholder from `modules/ui`.
- **Content:** a rewritten bio.

## Why

The legacy bio describes where you were around 2018. The embeds are part of the page's personality. The skeleton keeps the two third-party iframes from making the page feel slow, while still being the real embeds (you ruled out click-to-load).

## Scope

**In scope:**
- `Skeleton` component in `modules/ui`: generic and any size, exported from the barrel.
- `EmbedFrame`, a client component in the portfolio app: skeleton → iframe crossfade.
- About layout at all three breakpoints.
- New bio copy and embed URLs.

**Out of scope:**
- Cookie consent and a privacy banner. Accepted for now: the iframes set third-party cookies on every visit.
- Click-to-load placeholders (ruled out).
- Any other page using `Skeleton`, though it's built to be reusable.

## Approach

**`Skeleton`** (`modules/ui/src/skeleton/Skeleton.tsx` + `index.ts`, re-exported from `modules/ui/src/index.ts`):
- A `div` with `bg-field`, `rounded-control` and Tailwind's `animate-pulse` (turned off with `motion-reduce:animate-none`).
- Size and shape come entirely from `className`, so any width, height or rounding works, e.g. `<Skeleton className="h-[500px] w-[400px]" />`.
- `aria-hidden`. The loading announcement belongs to whatever uses it.
- Stays a server component: pure CSS, no `"use client"`.
- This is a new public component in `modules/ui`. It's shared because you asked for it in the UI library for reuse. No new dependency.

**`EmbedFrame`** (`apps/portfolio/components/embedFrame/`, `"use client"`):
- Props: `src`, `title` (required, the iframe's accessible name), and `className` for size.
- Renders a relatively positioned wrapper with `<Skeleton className="absolute inset-0" />`. **The iframe is mounted on the client after hydration**, not in the server render.
  - Reason: an iframe in the server HTML can finish loading before React attaches `onLoad`. The skeleton would then never clear, a known React quirk.
  - Hydration happens while the 1.5s preloader is still covering the page, so in practice the iframe still starts loading immediately, in parallel, as agreed.
- On `onLoad`: the iframe fades in (opacity 0 → 1, 300ms) and the skeleton is removed.
- `aria-busy` on the wrapper until loaded.
- A 10s fallback: if `onLoad` never fires (blocked by an ad or privacy blocker), the skeleton is swapped for a small "open on Instagram/SoundCloud" link. This is not click-to-load; it only covers a blocked embed.
- `loading="eager"`: it's on the first screen of a non-scrolling page, so lazy loading would do nothing.

**Layout** (from legacy `about.scss`):
- **Desktop:**
  - Two columns inside `PageShell`, content indented 6% at 90% width.
  - Left column 50%: `<h1>` code tags, heading "About me" in **accent**, then paragraphs as `TextSplit byWord` in monospace prose (12px/18px), `margin: 12px 0`.
  - Right column 35%, `margin-top: -4%`:
    - **Instagram** frame 400×500, top corners rounded 5px, `#f5f5f5` background behind the embed.
    - **SoundCloud** frame 400×115 below it.
    - Legacy absolutely positions SoundCloud at `top: calc(5% + 418px)`, which overlaps the bottom of the Instagram frame. Reproduce the position as it looks in the live side-by-side, not the numbers blindly, and note in the PR what was matched.
- **Tablet and mobile (≤1024):**
  - Single column, content indented 9% at 90% width.
  - Prose 16px/19px with 1px tracking (the 004a prose token).
  - **Instagram is not mounted at all.** Legacy hid it with `display: none`, but a hidden iframe still downloads everything. `EmbedFrame` for Instagram renders only when `matchMedia("(min-width: 1025px)")` matches.
  - SoundCloud: full width on mobile, 80% with `margin-top: 30px` on tablet.

**Embed URLs:**
- **Instagram:** `https://www.instagram.com/p/<id>/embed`.
- **SoundCloud:** the `w.soundcloud.com/player/?url=…` widget with the legacy parameters: `color=%23181818`, `auto_play=false`, `hide_related=false`, `show_comments=true`, `show_user=true`, `show_reposts=false`, `show_teaser=true`.
- The URLs are hardcoded in `app/about/page.tsx`. They're public embed links, so no env vars are needed.

**Length budget:** desktop doesn't scroll, so the bio must fit the left column at 1440×900 and at the 566px minimum height. Roughly the legacy amount: about 6 short paragraphs, about 120–160 words total. I'll draft to that and check it in the browser.

## Acceptance criteria

- [ ] `Skeleton` is exported from `@intromax/ui`, sized purely by `className`, pulses, and stays still under reduced motion
- [ ] On About, both skeletons show in the legacy positions and crossfade to the live embeds once loaded. No layout shift when they swap (skeleton and iframe share the same box)
- [ ] The iframes start loading while the preloader is still visible (network waterfall shows the requests before the overlay clears)
- [ ] ≤1024px: the Instagram iframe is **not requested** at all (network check); SoundCloud shows
- [ ] With the embed blocked (request blocked in the browser), the fallback link appears after the timeout
- [ ] Bio fits without scrolling at 1440×900; word-split hover bounce works; heading is accent
- [ ] e2e: About renders; the SoundCloud iframe mounts with its `title`; at 375px no Instagram iframe exists
- [ ] Side-by-side screenshots (375/800/1440) in the PR
- [ ] Lint, typecheck, build and e2e pass

## Open questions — content questionnaire (please answer before implementation)

1. **Current role:** company (Proffiz?), title, since when, and one or two things you own or have built there.
2. **Previous roles** (Benamix, Sol-Ra, M-Plus, and anything earlier worth a line): years, title, and one highlight each. Two or three of the strongest are enough; the bio is short.
3. **Focus now:** what you do best and what you're currently growing into (e.g. frontend architecture, monorepos, performance, design systems).
4. **Personal line:** legacy opened with "20-year-old developer from Ukraine". Keep a personal note (age, city, music since the page has SoundCloud)? What's fine to publish?
5. **Closing line:** legacy ended with "open to any suggestions". Current stance: open to offers, freelance, or neither?
6. **Tone:** first person, casual like legacy, or a bit more professional?
7. **Embeds:** keep the legacy Instagram post (`BEl5FGdDP1R`) and SoundCloud track (`236967116`), or send new URLs?
8. **Metadata:** About page title and a one-sentence description.
