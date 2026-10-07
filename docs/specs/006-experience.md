# Spec: Stage 6 — Experience page

## What

A long-form `/experience` page with four case studies of past work, a compact career timeline, and a "See more about my experience" link on Skills that leads to it.

## Why

Skills and About summarise the work in a few lines. A potential client needs to see what was actually built, how hard it was, and with what, before getting in touch.

## Scope

**In scope:**

- `app/experience/page.tsx`, with its content as typed data.
- Case-study sections, each with a key-facts strip, body text and stack chips.
- Two small architecture diagrams.
- A dim, pointer-reactive constellation backdrop.
- Jump links and a career timeline.
- `PageShell` scrolling on desktop.
- Inter as the reading font.
- The Skills link to the page.
- e2e and docs.

**Added during the stage** (requested while reviewing the page; see Deviations):

- The constellation backdrop on every framed page.
- Music that keeps playing across pages, with a mini player.
- The Skills sphere ignoring the pointer on its far side.

**Out of scope:**

- A header nav icon for the page.
- Screenshots, logos, and real-estate site names or links.
- Per-project dates.

## Approach

**Scrolling:**

- Desktop pages are single-screen and `html`/`body` don't scroll there.
- `PageShell` gains `scroll`: on desktop, the content block between the `<body>` tags becomes its own scroll container (`overflow-y: auto`). The frame tags stay pinned top and bottom, and the global rule in `globals.css` stays as it is.
- Tablet and mobile already scroll.
- Jump links point at section ids inside the container.

**Reading font:** Inter, a new Google Font loaded through `next/font/google` like Open Sans.

- `fonts.ts` exposes it as `--font-inter`.
- `theme.css` adds a `--font-reading` role and a `text-reading` size: 16px, line-height 1.6, 15px on mobile.
- Only this page uses it. Headings stay in Millunium, and code tags stay.

**Components (app-local):**

- `components/caseStudy/`: the section. It has an `h2` with company and client, a key-facts strip, the body (paragraphs and bullet lists), an optional diagram, and stack chips. The chips are static `<li>`s styled like the Skills category chips.
- `components/constellationBackdrop/`: the backdrop, mounted by `PageShell`, so every framed page has it. It's a dim canvas constellation whose stars drift, link to their neighbours, and link to the mouse pointer when it's near.
  - Canvas on GSAP's ticker, like the other constellations. It moves only once `usePreloaderDone()` is true.
  - About one star per 16,000px² of viewport, capped at 140, with the canvas resolution capped at 2×.
  - A resize keeps the existing stars and rescales them, so a mobile URL bar showing or hiding doesn't reshuffle the field.
  - Dim: links at 12% opacity, pointer links at 30%, and stars at 35%. Dimmer still below tablet.
  - `aria-hidden`.
- `components/diagram/`: inline SVG in the same thin-line style, `role="img"` with an `aria-label`. There are two:
  - **Platform:** the three places people use WorkJam (browser, Microsoft Teams, the mobile apps), the monorepo (Angular module apps with React features inside, the React unified app, shared packages and the design system), the separate chat app and its own server, and the GraphQL/REST APIs and Gemini.
  - **Chat bridge:** native iOS/Android app ↔ bridge ↔ the web chat in a WebView, with auth sync, sockets, and media events.
  - Below its minimum width a diagram scrolls sideways inside a focusable region instead of shrinking its text.
- `constants/experience.ts`: all copy as typed data, so the page only maps it.

**Skills:** a boxless link to `/experience` under the category chips.

- Its underline keeps drawing itself in, and its arrow nudges (`underline-draw` and `arrow-nudge` in `globals.css`).
- On hover or focus the underline settles in full and glows, and the arrow hurries.

**Metadata:**

- Title: "Experience - Ormaks"
- Description: "Case studies from Maks Chytailo's frontend work: an enterprise workforce platform used by 3 million people, billing for a packaging software leader, design-led sites and early product work."

## Content (draft for review)

The live copy is `apps/portfolio/constants/experience.ts`. It extends this draft with a "What I bring" column, the platform diagram, Teams, tests and analytics, and fuller stacks. Below is the first approved draft.

### Intro

**Heading:** Experience

I've been building for the web since 2017. Since 2019 I've worked at Proffiz, a software company that builds and maintains products for international clients, on platforms used by millions of people and on small sites where every animation counts.

Below are the projects that shaped me most: what each product is, what I built, the hard parts, and the tools behind them.

**Jump links:** WorkJam · Esko · Design-led sites · Early projects · Career

### 1. WorkJam

**Heading:** WorkJam - enterprise workforce platform
**Subheading:** Proffiz · Frontend Developer
**Key facts:** ~3M users · Angular + React monorepo · AI in the editor · Design system

WorkJam is a frontline workforce platform used by around 3 million people: scheduling, tasks, communication, learning, compliance and integrations with the tools a company already runs. The frontend is a large monorepo: several apps, shared packages and many teams. Legacy Angular apps live alongside a new React app, and new React features run inside the Angular ones.

I worked there as a frontend developer and one of the maintainers of the shared design system.

**The schedule.** I built the schedule from scratch on FullCalendar. It's the screen employees, managers and admins open every day.

- Daily, weekly and by-position views
- Adding, editing, duplicating and deleting shifts, shift swaps and open shifts
- Filters and pagination
- Behaviour that changes with each role and each company's feature flags

A page can hold hundreds of shifts, so I kept it fast by paginating employees, memoising shift cells and caching GraphQL and REST calls.

**AI writing assistant.** The platform's rich text editor (Lexical) is shared by documents, posts and comments. I owned the AI assistant inside it.

- A teammate built the Gemini backend with our architect.
- I built everything on the frontend: the editor integration, reading the response stream as it arrives, keeping the formatting intact, and the whole UI.
- People can pick a predefined action or write their own prompt to rewrite any part of the content.

**Chat inside the mobile apps.** I integrated the chat into the iOS and Android apps through a WebView. The hard parts were keeping socket connections alive across reconnects, and keeping authentication in sync between the main app and the chat. I also handled Android events so the chat could upload and edit media.

**Design system.** I built and maintained atomic components and their Storybook documentation. They're used across every app on the platform and follow accessibility standards.

**Angular and React side by side.** I shipped features into both stacks, and moved existing Angular features into the React infrastructure.

**Platform work.**

- Co-led the migration of feature flags from three systems to one, with zero downtime.
- Set up translations in the new React app at an early stage.
- Worked on an AI workflow that generates translations for 50+ languages.
- Worked on the Microsoft Teams integration.

I also mentored developers on the team.

**Diagram:** the monorepo (as described above).
**Diagram:** the chat bridge (as described above).

**Stack:** TypeScript · React · Next.js · Angular · GraphQL · REST · WebSockets · Tailwind CSS · Lexical · Gemini · Jest · Storybook · i18n

### 2. Esko

**Heading:** Esko - billing for packaging software
**Subheading:** Proffiz · Frontend Developer
**Key facts:** FastSpring billing · Subscriptions + roles · TypeScript and tests introduced

Esko builds pre-production software for the packaging and printing industry. I worked on a portal for managing users of their products, built on a microservice architecture.

- **Billing, end to end.** I introduced FastSpring billing into the portal: subscription flows, plan changes and payments, with role-based access deciding who can do what. I documented the integration fully.
- **TypeScript and tests.** I brought TypeScript and unit testing (Jest, React Testing Library) into the codebase.
- **Architecture and docs.** I improved the architecture as new features landed, and wrote the technical documentation.

**Stack:** React · TypeScript · Material-UI · Bootstrap · Jest · React Testing Library · Perforce

### 3. Design-led sites

**Heading:** Design-led real-estate sites
**Subheading:** Proffiz · Frontend Developer
**Key facts:** 8-10 sites · GSAP · PageSpeed · End-to-end ownership

Short projects for real-estate developers: one- to three-page sites where design and motion sell the property. I built about eight to ten of them, some from scratch and some taken over and extended, and owned each one from architecture through launch and support.

- **Motion:** GSAP and fullPage.js scenes, and SVG animations that react to what the visitor does.
- **Performance:** I tuned every site against PageSpeed Insights by optimising images, animations and video, and built static pages with Gatsby.
- **Integrations:** Firebase for securely stored data, Mapbox maps, and custom HTML email templates.

I also mentored developers who joined these projects.

**Stack:** TypeScript · React · Gatsby · GraphQL · styled-components · GSAP · fullPage.js · Mapbox · Firebase

### 4. Early projects

**Heading:** Early projects
**Key facts:** Crypto payments · WebSockets · CRM dashboards

**Benamix - Frontend Developer.**

- A crypto finance platform: payment flows, an integrated bounty program, live data over WebSockets, and charts.
- A corporate site with its own design and animations, where interactivity and speed came first.
- Smaller shops and landing pages.

**Sol-Ra - Frontend Developer (React, remote).**

- An internal CRM for the company's employees, with data tables and analytics dashboards.

**Stack:** JavaScript · React · Redux · Material-UI · SCSS · WebSockets

### Career

| Years               | Role                                                              | Company                                               |
| ------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Nov 2019 - present  | Senior Frontend Developer                                         | Proffiz                                               |
| Jul 2018 - Sep 2019 | Frontend Developer                                                | Benamix                                               |
| Sep 2017 - Jun 2018 | Frontend Developer (React)                                        | Sol-Ra, remote                                        |
| Jul 2017 - Sep 2017 | Junior Frontend Developer                                         | M-Pluse - e-commerce and interactive sites in Angular |
| 2015 - 2021         | Applied Mathematics and Computer Science, Bachelor's and Master's | Ivan Franko University                                |

Beyond code, I mentor developers and take part in technical interviews for new hires.

**Closing:** Have a project in mind? Let's talk. (A button to `/contact`.)

## Acceptance criteria

- [x] `/experience` renders the intro, jump links, four case studies, two diagrams and the career timeline, prerendered as static.
- [x] Skills shows "See more about my experience" with a drawing underline, a nudging arrow and a hover glow, and it navigates to `/experience`.
- [x] On desktop the content scrolls inside the frame, the frame tags stay put, and jump links scroll to their sections.
- [x] Body text renders in Inter. Headings stay in Millunium.
- [x] The constellation backdrop drifts, reacts to the pointer, and is hidden from assistive technology.
- [x] No header icon lights up on `/experience`.
- [x] Lint, typecheck, build and the full e2e suite pass.

## Deviations

- **The scroll container is a focusable region** ("Page content", `tabIndex={0}`), so the page scrolls from the keyboard on desktop. The document itself doesn't scroll there.
- **Edges fade.** The desktop scroll area fades out over 32px at its top and bottom instead of cutting text off at the frame tags. Jump links land 48px below the top, clear of the fade.
- **Reading text is a `reading-text` Tailwind utility** (`@utility` in `globals.css`), shared by the page and `CaseStudy`.
- **Diagrams have a minimum width** (34rem for the platform, 20rem for the chat bridge). Below it they scroll sideways, so their 12-14 unit labels never render much below 9px.
- **The backdrop became a canvas constellation on every framed page.** It was first a few SVG traces on this page only. You picked the pointer-reactive variant from playable previews, made darker for reading, and then asked for it on all pages. Below tablet it's dimmer still, because text covers more of the screen.
- **The Skills call to action is a boxless link,** not the bordered pulsing button first planned. It sits under the category chips and has a drawing underline, a nudging arrow and a hover glow. You picked it from five playable variants.
- **The copy grew about 50%** over the first approved draft (kept as "exp1"). It adds a "What I bring" column, the WorkJam platform diagram, Teams, tests and analytics, and fuller stacks. Case studies are two columns on desktop.
- **Music plays across the site.** The SoundCloud widget moved from About into `MusicProvider` in the root layout, and a floating `MiniPlayer` controls it on other pages. About's player gained a volume slider (70% by default), and seeking before the first play no longer breaks playback.
- **The Skills sphere's far half ignores the pointer,** so only front-facing words respond to hover and clicks.

## Decisions from review

- **Esko's portal is not named.** It's described only as "a portal for managing users of their products".
- **The Proffiz description is confirmed:** "a software company that builds and maintains products for international clients".
- **Case-study subheadings use the general title "Frontend Developer"**, matching the site copy ("frontend developer") and the CV. The career table keeps the CV titles.
