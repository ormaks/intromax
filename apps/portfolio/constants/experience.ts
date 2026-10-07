/** A run of text with an optional bold lead-in, e.g. "The schedule." */
export type Passage = {
  lead?: string;
  text: string;
};

export type DiagramId = "platform" | "chatBridge";

export type Block =
  | { kind: "paragraph"; passage: Passage }
  | { kind: "subheading"; text: string }
  | { kind: "list"; items: Passage[] }
  | { kind: "diagram"; id: DiagramId };

export type CaseStudy = {
  /** Section id, the jump-link target. */
  id: string;
  /** Short name for the jump links. */
  label: string;
  title: string;
  subtitle?: string;
  facts: string[];
  blocks: Block[];
  stack: string[];
};

export type CareerEntry = {
  period: string;
  role: string;
  company: string;
};

const p = (text: string, lead?: string): Block => ({
  kind: "paragraph",
  passage: { lead, text },
});

const sub = (text: string): Block => ({ kind: "subheading", text });

const list = (...items: Passage[]): Block => ({ kind: "list", items });

export const INTRO = [
  "I'm a frontend developer with a degree in Applied Mathematics and Computer Science, building for the web since 2017. Since 2019 I've worked at Proffiz, a software company that builds and maintains products for international clients - on platforms used by millions of people and on small sites where every animation counts.",
  "My focus is scalable web applications: complex UI features, modular architecture and the third-party services a product depends on. I take work from design handoff to production, and I'm at home in large codebases and cross-functional teams, where clean, maintainable code matters more than clever code.",
  "Below are the projects that shaped me most: what each product is, what I built, the hard parts, and the tools behind them. For each one I've picked the most interesting work - along the way I built many other features too.",
];

/** What I bring, shown beside the intro. */
export const STRENGTHS: Passage[] = [
  {
    lead: "Architecture.",
    text: "Modular monorepos, microservice frontends, Angular and React side by side.",
  },
  {
    lead: "Product features.",
    text: "Schedules, rich text editors, billing, chat and dashboards, end to end.",
  },
  {
    lead: "Integrations.",
    text: "AI (Gemini), billing (FastSpring), embedded chat, Microsoft Teams, maps.",
  },
  {
    lead: "Design systems.",
    text: "Accessible atomic components, documented in Storybook.",
  },
  {
    lead: "Motion and speed.",
    text: "GSAP animation tuned against PageSpeed Insights.",
  },
  {
    lead: "People.",
    text: "Mentoring developers and interviewing new hires.",
  },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "workjam",
    label: "WorkJam",
    title: "WorkJam - enterprise workforce platform",
    subtitle: "Proffiz · Frontend Developer",
    facts: [
      "~3M users",
      "Angular + React monorepo",
      "Microsoft Teams",
      "AI in the editor",
      "Design system",
      "Unit tests + analytics",
    ],
    blocks: [
      p(
        "WorkJam is a frontline workforce platform used by around 3 million people: scheduling, tasks, communication, learning, compliance and integrations with the tools a company already runs. The frontend is a large monorepo - several module apps, a unified app, shared packages and many teams. Legacy Angular apps live alongside the new React app, and new React features run inside the Angular ones, so the product moves forward without a rewrite.",
      ),
      p(
        "The same apps open in a browser, inside Microsoft Teams and inside the iOS and Android apps, while the chat is a separate product on its own server.",
      ),
      { kind: "diagram", id: "platform" },
      p(
        "I worked there as a frontend developer and one of the maintainers of the shared design system. Below are the parts I found most interesting; alongside them I built many other features across the platform's sections.",
      ),
      p(
        "I built the schedule from scratch on FullCalendar - the screen employees, managers and admins open every day:",
        "The schedule.",
      ),
      list(
        { text: "daily, weekly and by-position views" },
        {
          text: "adding, editing, duplicating and deleting shifts, shift swaps and open shifts",
        },
        { text: "filters and pagination" },
        {
          text: "behaviour that changes with each role and each company's feature flags",
        },
      ),
      p(
        "A page can hold hundreds of shifts, so I kept it fast by paginating employees, memoising shift cells and caching GraphQL and REST calls.",
      ),
      p(
        "The platform's rich text editor (Lexical) is shared by documents, posts and comments, and I owned the AI assistant inside it. A teammate built the Gemini backend with our architect; I built everything on the frontend - the editor integration, reading the response stream as it arrives, keeping the formatting intact, and the whole UI. People can pick a predefined action or write their own prompt to rewrite any part of the content, and the result lands in the editor already formatted.",
        "AI writing assistant.",
      ),
      p(
        "The chat is a separate project, deployed on its own server. In the iOS and Android apps it runs in a WebView, which keeps the native apps light, and a bridge lets the two sides talk: people are already signed in when they open it, and the chat can reach native features like the camera.",
        "Chat inside the mobile apps.",
      ),
      p(
        "My part was the connection between the two. I kept socket connections alive across reconnects, kept authentication in sync between the main app and the chat, and handled the Android events the chat needs to upload and edit media.",
      ),
      { kind: "diagram", id: "chatBridge" },
      p(
        "WorkJam also runs inside Microsoft Teams, where the module apps and the unified app have to behave like one product that knows who the user is and which company they belong to. I worked on that integration as features moved into it.",
        "Microsoft Teams.",
      ),
      p(
        "I built and maintained atomic components and their Storybook documentation. They're used across every app on the platform and follow accessibility standards, so a fix in one place reaches every team.",
        "Design system.",
      ),
      p(
        "I shipped features into both stacks, and moved existing Angular features into the React infrastructure.",
        "Angular and React side by side.",
      ),
      p(
        "I covered the features I built with unit tests (Jest, Testing Library), and wired Google Analytics events into them, so the team could see how people actually used each feature.",
        "Tests and analytics.",
      ),
      sub("Platform work"),
      list(
        {
          text: "Co-led the migration of feature flags - the switches that decide what each company sees - from three systems to one. Old and new ran side by side and rolled out step by step, with zero downtime",
        },
        { text: "Set up translations in the new React app at an early stage" },
        {
          text: "Worked on an AI workflow that turns new translation keys into 50+ languages and opens the pull request",
        },
      ),
      p("I also mentored developers on the team."),
    ],
    stack: [
      "TypeScript",
      "JavaScript",
      "React",
      "Next.js",
      "Angular",
      "HTML5",
      "CSS3",
      "SCSS",
      "Tailwind CSS",
      "GraphQL",
      "Apollo Client",
      "REST",
      "WebSockets",
      "Lexical",
      "Gemini",
      "Microsoft Teams",
      "WebView",
      "Feature flags",
      "Google Analytics",
      "Jest",
      "Testing Library",
      "Storybook",
      "Design systems",
      "Nx",
      "Monorepos",
      "i18n",
      "Git",
    ],
  },
  {
    id: "esko",
    label: "Esko",
    title: "Esko - billing for packaging software",
    subtitle: "Proffiz · Frontend Developer",
    facts: [
      "FastSpring billing",
      "Subscriptions + roles",
      "Microservices",
      "TypeScript and tests introduced",
    ],
    blocks: [
      p(
        "Esko builds pre-production software for the packaging and printing industry. I worked on a portal for managing users of their products, built on a microservice architecture.",
      ),
      list(
        {
          lead: "Billing, end to end.",
          text: "I introduced FastSpring billing into the portal: subscription flows, plan changes and payments, with role-based access deciding who can do what. I documented the integration fully.",
        },
        {
          lead: "Fitting it into microservices.",
          text: "Billing and access touched several services at once, so the frontend had to stay in step with each of them as subscriptions changed.",
        },
        {
          lead: "TypeScript and tests.",
          text: "I brought TypeScript and unit testing (Jest, React Testing Library) into the codebase.",
        },
        {
          lead: "Features, architecture and docs.",
          text: "I built new product features, improved the architecture as they landed, and wrote the technical documentation.",
        },
      ),
    ],
    stack: [
      "TypeScript",
      "JavaScript",
      "React",
      "HTML5",
      "CSS3",
      "Material UI",
      "Bootstrap",
      "FastSpring",
      "Role-based access",
      "Microservices",
      "Jest",
      "Testing Library",
      "Perforce",
    ],
  },
  {
    id: "design-sites",
    label: "Design-led sites",
    title: "Design-led real-estate sites",
    subtitle: "Proffiz · Frontend Developer",
    facts: ["8-10 sites", "GSAP", "PageSpeed", "End-to-end ownership"],
    blocks: [
      p(
        "Short projects for real-estate developers: one- to three-page sites where design and motion sell the property. I built about eight to ten of them, some from scratch and some taken over and extended, and owned each one from architecture through launch and post-launch support.",
      ),
      list(
        {
          lead: "Motion.",
          text: "GSAP and fullPage.js scenes, and SVG animations that react to what the visitor does.",
        },
        {
          lead: "Performance.",
          text: "Heavy visuals still had to load fast. I tuned every site against PageSpeed Insights by optimising images, animations and video, and built static pages with Gatsby.",
        },
        {
          lead: "Integrations.",
          text: "Third-party platforms and services, Firebase for securely stored data, Mapbox maps, and custom HTML email templates.",
        },
        {
          lead: "Existing sites.",
          text: "Besides new builds, I extended and maintained sites the clients already had.",
        },
      ),
      p("I also mentored developers who joined these projects."),
    ],
    stack: [
      "TypeScript",
      "JavaScript",
      "React",
      "Gatsby",
      "HTML5",
      "CSS3",
      "styled-components",
      "SVG animation",
      "GSAP",
      "fullPage.js",
      "GraphQL",
      "Firebase",
      "Mapbox",
      "PageSpeed Insights",
      "HTML email",
      "GitHub",
    ],
  },
  {
    id: "early-projects",
    label: "Early projects",
    title: "Early projects",
    facts: ["Crypto payments", "WebSockets", "CRM dashboards", "Angular"],
    blocks: [
      sub("Benamix - Frontend Developer"),
      list(
        {
          text: "A crypto finance platform: payment flows, an integrated bounty program, the algorithms behind them, live data over WebSockets, and charts",
        },
        {
          text: "A corporate site with its own design and animations, where interactivity and speed came first",
        },
        { text: "Smaller shops and landing pages with complex layouts" },
      ),
      sub("Sol-Ra - Frontend Developer (React, remote)"),
      list({
        text: "An internal CRM for the company's employees, with data tables and analytics dashboards",
      }),
      sub("M-Pluse - Junior Frontend Developer"),
      list({
        text: "Client projects from e-commerce to interactive, design-focused sites, built with Angular",
      }),
    ],
    stack: [
      "JavaScript",
      "React",
      "Redux",
      "Angular",
      "HTML5",
      "CSS3",
      "SCSS",
      "Material UI",
      "WebSockets",
      "Charts",
      "Data tables",
    ],
  },
];

export const CAREER: CareerEntry[] = [
  {
    period: "Nov 2019 - present",
    role: "Senior Frontend Developer",
    company: "Proffiz",
  },
  {
    period: "Jul 2018 - Sep 2019",
    role: "Frontend Developer",
    company: "Benamix",
  },
  {
    period: "Sep 2017 - Jun 2018",
    role: "Frontend Developer (React)",
    company: "Sol-Ra, remote",
  },
  {
    period: "Jul 2017 - Sep 2017",
    role: "Junior Frontend Developer",
    company: "M-Pluse - e-commerce and interactive sites in Angular",
  },
  {
    period: "2015 - 2021",
    role: "Applied Mathematics and Computer Science, Bachelor's and Master's",
    company: "Ivan Franko University",
  },
];

export const CAREER_NOTE =
  "Beyond code, I mentor developers and take part in technical interviews for new hires.";
