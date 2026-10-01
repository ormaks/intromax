# Spec: Stage 4d — About page

## What

The About page, rebuilt from the legacy layout with two new interactive pieces in the right column:

- **Left:** the accent "About me" heading and a rewritten bio, animated word by word.
- **Right (desktop):** a **reactive wolf**, the wolf line art bending away from the cursor and springing back. Below it, a **custom music player** that drives SoundCloud through its Widget API.
- **Right (tablet/mobile):** the player alone, below the bio.
- **Shared:** a new reusable `Skeleton` placeholder in `modules/ui`, used for the player's loading state.

## Why

The legacy bio describes where you were around 2018. The legacy right column (an old Instagram post and a stock SoundCloud iframe) looked dated and off-brand. Both are now on-brand and interactive, which suits a site where motion is the point.

## Scope

**In scope:**

- `Skeleton` component in `modules/ui`: generic and any size, exported from the barrel.
- `MusicPlayer`: our own player UI over a hidden SoundCloud widget, driven by `SC.Widget`.
- `ReactiveWolf`: desktop only, decorative.
- About layout at all three breakpoints.
- New bio copy and metadata.

**Out of scope:**

- Instagram. It's dropped.
- Cookie consent and a privacy banner. Accepted for now: the hidden SoundCloud iframe sets third-party cookies.
- Playlists, volume control, a waveform. One track, play/pause and seek.
- The shared TextSplit heading a11y name and the code-tag spacing gap. They're left to an end-of-Stage-4 polish pass.

## Approach

**`Skeleton`** (`modules/ui/src/skeleton/`):

- A `div` with `bg-field`, `rounded-control` and `animate-pulse`, sized entirely by `className`.
- `aria-hidden`; the loading announcement belongs to whatever uses it.
- A server component, with no new dependency.
- No reduced-motion override: the site animates for everyone.

**`MusicPlayer`** (`apps/portfolio/components/musicPlayer/`, `"use client"`):

- **Widget:**
  - SoundCloud's Widget API script (`https://w.soundcloud.com/player/api.js`) loads via `next/script` on About only. This is a new external script but not a new service.
  - The real widget iframe is mounted after hydration and hidden visually and from assistive tech. It has `allow="autoplay"` so our button's click can start playback.
  - Track: SoundCloud ID 236967116.
- **UI:**
  - An accent play/pause `<button>` whose `aria-label` names the action ("Play" / "Pause").
  - Title and artist.
  - A progress line in accent with a glowing tip; the preloader bar's look.
  - Elapsed and total time.
- **Seeking:** click or drag on the line. The line is also a keyboard `role="slider"`; arrow keys seek ±5s.
- **States:**
  - **Loading:** a `Skeleton` in the player's fixed box, so there's no layout shift.
  - **Ready:** the player UI.
  - **Blocked:** if the widget isn't ready within 10s (for example, blocked by a privacy extension), or reports no track (removed or region-locked), a "Listen on SoundCloud" link replaces the player.
- **Cleanup:** on unmount, listeners are unbound and playback stops.

**`ReactiveWolf`** (`apps/portfolio/components/reactiveWolf/`, `"use client"`):

- Renders `Wolf` large, on desktop only. Touch layouts scroll, and dragging over the art would fight the scroll.
- **Entrance:** a short top-to-bottom DrawSVG draw-in, gated on `usePreloaderDone()`.
- **Interaction:**
  - Every vertex's target is its original position pushed away from the pointer, with a smooth falloff inside a radius.
  - A spring (velocity and damping) on `gsap.ticker` eases vertices toward their targets. The ticker runs only while anything is moving.
  - When the pointer leaves, everything springs back.
  - **Click ripple:** an accent ring expands from the click and fades, while a shockwave knocks the nearby vertices outward (a velocity kick, targets unchanged), so they wobble back on the same spring.
  - Displacement depends only on a vertex's original position, so the joints shared between lines and filled shapes stay together.
- Decorative (`aria-hidden`).

**Layout:**

- **Desktop:**
  - Two columns inside `PageShell` (indent 6%), vertically centred.
  - The left column is half the width: code tags, the accent heading, then six word-split paragraphs in monospace prose.
  - The right column is the reactive wolf above the player.
- **Tablet and mobile:** a single column (indent 9%), with the player below the bio. The player is full width on mobile and 4/5 width on tablet.
- **Sizing:** Tailwind scale values only, no custom pixel or percentage sizes. The `PageShell` indents are the only exception; they're the shell's own convention.
- **Length budget:** desktop doesn't scroll, so the bio must fit at 1440×900 and at the 566px minimum height.

## Acceptance criteria

- [x] `Skeleton` is exported from `@intromax/ui`, sized purely by `className`, and pulses
- [x] The player shows a skeleton until SoundCloud is ready, then the player UI, with no layout shift
- [x] Play/pause works from our button; progress moves; click, drag and arrow keys seek
- [x] With the widget blocked, the "Listen on SoundCloud" link appears after the timeout
- [x] Desktop: the wolf draws in after the preloader, bends away from the cursor and springs back, and a click sends out a ripple and shockwave; it's absent at ≤1024px
- [x] Bio fits without scrolling at 1440×900; the word-split hover bounce works; the heading is accent
- [x] No Instagram iframe anywhere
- [x] e2e: About renders; the player loads (stubbed widget), plays and seeks; the fallback appears when blocked; the wolf reacts at 1440 and is absent at 375
- [ ] Side-by-side screenshots (375/800/1440) in the PR
- [x] Lint, typecheck, build and e2e pass

## Content (answered)

1. **Bio**, six paragraphs, first person, professional, no company names, "-" rather than "—":
   - I'm a senior frontend developer, building for the web since 2017 - from enterprise platforms to design-led sites where motion and interaction are the point.
   - Most recently I worked on a large-scale workforce management SaaS: a modular monorepo across web, iOS and Android. I built complex features across its microservice frontend, maintained the shared design system, and brought AI-powered features into the product.
   - Along the way I've built a crypto finance platform with payments, a billing integration with complex subscription flows and role-based access, and an internal CRM with analytics dashboards.
   - I've also owned smaller, animation-heavy projects end to end, from architecture through launch and support.
   - My focus now is frontend architecture, monorepos, performance and design systems.
   - Open to new offers - get in touch.
2. **Music:** the legacy track, "Ereny Youssef – Amy Winehouse – Back To Black". The track you wanted, Hosh's "Tighter" (CamelPhat Remix), has no official SoundCloud upload.
3. **Metadata:** title "About - Ormaks"; description "About Maks Chytailo, a senior frontend developer building large-scale web platforms, design systems and animation-rich interfaces."

## Deviations during implementation

- **Instagram dropped; the reactive wolf replaces it.** You chose this direction in review.
- **The custom player replaces the plain SoundCloud iframe and the planned `EmbedFrame`.** SoundCloud's Widget API is current, so the right column can match the site instead of SoundCloud's styling. `EmbedFrame` (skeleton → iframe crossfade) isn't needed without visible iframes.
- **Click ripple + shockwave on the wolf**, added after review at your request.
- **Site copy uses "-", never "—" (new AGENTS.md rule). Existing titles, the contact toast and the logo label were updated to match.
