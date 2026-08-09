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
2. **Letter-by-letter text-split animation** — the `TextSplit`/`AnimatedText` heading treatment on Home/About/Skills. Straightforward to rebuild cleanly with modern React + CSS/Framer Motion, no legacy dependency needed.

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

## Extracted base tokens (from legacy `main.scss`)

- Background: `#252627` (dark), text: `#fff`
- Muted/decorative text (the "code tags" motif): `#515152`
- Custom cursor image (`cursor.cur`) — nice detail, cheap to reproduce
- Font roles: a display/heading font (`MyHeader`, mapped to one of the custom `.ttf` files) and a monospace-ish "tag" font (`MyTags`, cursive fallback) for the decorative markup text
- These are a starting point, not the full palette — per-page SCSS files (`home.scss`, `about.scss`, etc.) likely carry more; worth a deeper pass when Stage 2 actually builds the Tailwind preset

## Implication for packages/ui / design tokens

The custom fonts and any extractable color/spacing values from the legacy SCSS are worth pulling into `packages/config`'s Tailwind preset / `packages/ui` design tokens early, since the visual identity is meant to persist — no need to reinvent the palette or type scale from scratch in Stage 2.
