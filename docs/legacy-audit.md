# Legacy repo audit — ormaks/react-portfolio

Source: https://github.com/ormaks/react-portfolio (cloned directly for inspection). App lives in `my-app/`.

## Directive

**Full visual/functional fidelity, new stack.** Design, layout, functionality, and animations should all be preserved and recreated faithfully — this is not a redesign, it's a technical rebuild of the same site. Content (bio text, skills list) gets updated to reflect where things actually stand now, but the visual and interactive identity carries forward deliberately.

## Stack (legacy — none of this carries forward as code)

React 16.3, class components, custom Webpack 4 + Babel 6 config, `node-sass` (deprecated), jQuery, `react-router` v4. Roughly 2018-era React — no code here is portable to Next.js/App Router/TypeScript. Treat this repo as a **design and content reference only**, never a copy source.

## Pages

- **Home** — animated intro (letter-by-letter text-split effect via a custom `TextSplit`/`AnimatedText` component), preloader on load, mirrored SVG "Ormaks" wordmark, wolf imagery, "view source" decorative aesthetic (literal `<body>`/`<h1>` tags rendered as design elements around content)
- **About** — personal bio (career history, currently stale — predates Proffiz), embedded Instagram + SoundCloud iframes
- **Skills** — 3D tag-cloud/sphere of skill keywords, built on `TagCanvas` (jQuery + `<canvas>`, now unmaintained)
- **Contact** — Google Maps with custom marker/styling, animated fly-in text on input, custom validation. **Form never actually submitted anywhere** — pure UI demo, no backend was ever wired up.
- **Works/Projects** — exists as a stub, never wired into routing. Effectively never shipped.

## Must-preserve elements (personal significance — not optional)

1. **Skills sphere / tag-cloud visualization** — the 3D rotating tag cloud on the Skills page. `TagCanvas` itself is dead technology; needs a modern equivalent (candidates to evaluate in Stage 2/4: `react-tagcloud`, `d3-cloud`, or a custom canvas/WebGL implementation) that reproduces the same rotating-sphere feel.
2. **Per-letter text-split animation** — the `TextSplit`/`AnimatedText` heading treatment on Home/About/Skills. Rebuilt in Stage 2 with CSS keyframes only; no motion library was needed. Note the effect is a per-letter bounce **on hover** (animate.css `rubberBand`, 1s), not an entrance animation on load — "letter-by-letter" here describes the split, not a staggered reveal.

## Other design signatures worth carrying forward (not personally load-bearing, but part of the site's identity)

- The "code as design" motif — decorative markup-as-text framing content
- Mirrored logo treatment, wolf branding
- Custom display fonts: `DancingScript`, `LaBelleAurore`, `Millunium-BOLD`, `tempsitc` (font files present in legacy `src/fonts/` — reusable assets, not code)
- Preloader-on-page-load pattern

## What's genuinely new (nothing to migrate)

- **Contact form backend** — never existed in the legacy version. Stage 3's Resend-backed endpoint isn't replacing working functionality, it's the first time this form actually does anything.
- **Works/Projects page** — never shipped. The new pet-projects "Lab" section is new territory, not a migration.

## Content that needs rewriting, not porting

- About page bio — reflects ~2018 career state, needs a full rewrite against current experience (Proffiz, Benamix, Sol-Ra, M-Plus)
- Skills list — reflects the old stack (AngularJS, .NET, C++, Gulp, jQuery); needs to reflect the current one (React, TypeScript, Next.js, Nx, TanStack Query, etc.)

## Extracted base tokens

Stage 2 did the deeper per-page SCSS pass this section originally deferred. The
values below are the result — the earlier `main.scss`-only list understated both
the palette and the font roles.

**Colors**

| Value | Role | Notes |
|---|---|---|
| `#252627` | page background | |
| `#fff` | body text | |
| `#08fdd8` | **accent** | The dominant color — 23 uses. Buttons, borders, input underlines, wordmark glow, 404 glitch. Missed entirely by the first pass. |
| `#515152` | muted / decorative "code tags" text | |
| `#181818` | raised surface | header rail background |
| `#4d4d4e` | borders, hairlines | |
| `#37393b` | form field fill | |

Secondary one-off greys (`#8d8d8d`, `#949292`, `#222324`, `#284641`) are page
decoration rather than tokens, and are left to the Stage 4 fidelity pass.

**Font roles** — five, not two (`main.scss:81-107`):

| Legacy name | File | Role |
|---|---|---|
| `MyHeader` | `Millunium-BOLD.ttf` | headings (`.text_h1`, 56px / 35px mobile) |
| `MyTags` | `LaBelleAurore.ttf` | the decorative markup text |
| `MyLogo` | `DancingScript-Regular/Bold.ttf` | the "Ormaks" wordmark |
| `LogoImg` | `tempsitc.ttf` | secondary logo treatment |
| — | `"Open Sans"` (web font) | body copy |

**Type scale**: headings 56px/53px line-height, stepping to 35px/30px under
480px; tag text 18px; small text 11-13px.

Also: custom cursor image (`cursor.cur`) — nice detail, cheap to reproduce,
not yet migrated.

## Implication for modules/ui / design tokens

The custom fonts and any extractable color/spacing values from the legacy SCSS are worth pulling into `modules/config`'s Tailwind preset / `modules/ui` design tokens early, since the visual identity is meant to persist — no need to reinvent the palette or type scale from scratch in Stage 2.
