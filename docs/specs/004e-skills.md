# Spec: Stage 4e — Skills page

## What

The Skills page, built around the site's must-preserve piece: a rotating 3D sphere of skills.

- **Left:** the "Skills & Experience" heading, word-split prose in which every named technology is wired to the sphere, a row of category chips, and a closing line with LinkedIn and contact links.
- **Right:** the **constellation sphere**. Skill words float on a slowly rotating sphere, linked to their nearest neighbours by thin accent lines. The rotation follows the mouse, and the words light up, grow and send pulses along the links.

## Why

The sphere is personally important, and the technology behind the original (TagCanvas) is dead. Rebuilding it lets it become more than decoration. Wiring it to the text and to categories turns it into a way to explore the skill set.

## Scope

**In scope:**

- The sphere: placement, rotation, steering, links, highlights, focus rotation, pulses and fade-in.
- Linked words in the prose, category chips, and TextSplit's link mode for the inline LinkedIn and contact links.
- The page at all three breakpoints, plus copy and metadata.

**Out of scope:**

- The shared TextSplit heading a11y name and the code-tag spacing gap (Stage 4h polish).
- A per-skill details panel or proficiency levels.

## Approach

**Skills (34) in four categories:**

| Category            | Skills                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Core                | TypeScript, JavaScript, React, Next.js, HTML5, CSS3, Node.js, Angular                           |
| Styling and motion  | SCSS, Tailwind CSS, styled-components, Material UI, GSAP, Design systems, Lexical               |
| Data and state      | Redux, Redux-Saga, MobX, GraphQL, Apollo Client, REST, Firebase, NoSQL                          |
| Tooling and testing | Jest, Testing Library, Storybook, Webpack, Nx, Monorepos, Gatsby, Git, i18n, Mapbox, Playwright |

**Sphere core** (`components/skillSphere/sphere.ts`, plain TypeScript):

- **Placement:**
  - 34 points spread evenly over the sphere.
  - Four category centres at the corners of a regular tetrahedron.
  - Points are assigned to categories greedily, nearest centre first, capped at each category's size. Each category therefore occupies one contiguous region.
- **Links:** each point's 4 nearest neighbours, deduplicated. That's enough to read as one connected web without becoming a hairball.
- **Rotation:** a quaternion orientation, advanced every frame by an angular velocity. The velocity eases toward a target:
  - a slow default spin
  - a pointer-driven spin, where the pointer's offset from the sphere centre sets the speed and axis
  - a slowed spin while anything is highlighted
- **Focus:** the sphere eases (slerp) to the orientation that brings a skill or a group's centroid to the front, and holds there until released.
- **Rendering (hybrid):**
  - **Words:** real HTML list items, positioned with `transform`/`opacity` from their projected depth. Highlighted words grow to about 1.3×.
  - **Links and pulses:** drawn on a canvas behind the words. A pulse is a dot travelling along a link.
  - Everything runs on GSAP's ticker while the sphere is mounted.

**Interactions:**

| Trigger                                       | Highlight              | Sphere                        | Click                               |
| --------------------------------------------- | ---------------------- | ----------------------------- | ----------------------------------- |
| Hover or focus a **linked word** in the prose | that skill only        | brings it to the front        | pulses out from it                  |
| Hover or focus a **category chip**            | the whole category     | brings the group to the front | pulses travel through the group     |
| Hover a **sphere word**                       | the word and its links | stops                         | pulses along its links, then theirs |

- On unhover or blur, the highlight clears and the spin eases back to its slow default.
- The pointer steers the sphere only over the **sphere column** (a wide area, not just the sphere itself). Over the text column it doesn't steer.

**Shared state:** a small client context (`SkillFocus`) carries the sphere's highlight, focus and pulse callbacks, so the prose links and chips can drive it.

**TextSplit link mode:** with `href`, the text renders as one link that bounces as a single unit. Internal links use `next/link`; external ones open in a new tab with `rel="noopener noreferrer"`.

**Layout:**

- **Desktop:** two columns. The text column is half the width; the sphere is centred in the rest.
- **Tablet and mobile:** the sphere sits below the text, sized to the column. It auto-rotates and taps work; there's no pointer steering on touch.
- **Sizing:** Tailwind scale values only.
- **Fit:** the page must fit without scrolling at 1440×900 and at the 566px minimum height.

## Acceptance criteria

- [x] 34 skills render as a list; each category occupies one region of the sphere
- [x] The sphere fades in after the preloader and spins slowly
- [x] The pointer steers it over the sphere column and not over the text column
- [x] A linked word lights only its skill and brings it to the front; a chip lights its category and brings that to the front
- [x] A sphere word lights itself and its links; highlighted words grow; a click sends pulses
- [x] On release, the spin returns to slow
- [x] LinkedIn opens in a new tab; "contact" goes to `/contact`; both bounce as one unit
- [x] Fits without scrolling at 1440×900; tablet and mobile stack the sphere below the text
- [x] e2e covers the above
- [x] Lint, typecheck, build and e2e pass

## Content

- **Heading:** "Skills &" / "Experience" (accent).
- **Prose** (bracketed words are wired to the sphere):
  - My main area is frontend development: scalable web apps with [React], [TypeScript] and [Next.js] - from component architecture and [design systems] to complex UI features and animation with [GSAP].
  - Around that I work with [GraphQL] and [REST] data layers, state management with [Redux] and [MobX], testing with [Jest] and [Playwright], and monorepo tooling like [Nx]. I also have experience with [Angular] and [Node.js].
  - Want to know more? Check my LinkedIn profile or contact me.
- **Metadata:** title "Skills - Ormaks"; description "The skills and tools Maks Chytailo works with, from React, TypeScript and Next.js to testing and monorepo tooling."
