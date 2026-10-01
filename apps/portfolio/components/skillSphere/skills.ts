export type CategoryId = "core" | "styling" | "data" | "tooling";

export type Category = { id: CategoryId; label: string };

export type Skill = { name: string; category: CategoryId };

export const CATEGORIES: Category[] = [
  { id: "core", label: "core" },
  { id: "styling", label: "styling and motion" },
  { id: "data", label: "data and state" },
  { id: "tooling", label: "tooling and testing" },
];

const BY_CATEGORY: Record<CategoryId, string[]> = {
  core: [
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "HTML5",
    "CSS3",
    "Node.js",
    "Angular",
  ],
  styling: [
    "SCSS",
    "Tailwind CSS",
    "styled-components",
    "Material UI",
    "GSAP",
    "Design systems",
    "Lexical",
  ],
  data: [
    "Redux",
    "Redux-Saga",
    "MobX",
    "GraphQL",
    "Apollo Client",
    "REST",
    "Firebase",
    "NoSQL",
  ],
  tooling: [
    "Jest",
    "Testing Library",
    "Storybook",
    "Webpack",
    "Nx",
    "Monorepos",
    "Gatsby",
    "Git",
    "i18n",
    "Mapbox",
    "Playwright",
  ],
};

export const SKILLS: Skill[] = CATEGORIES.flatMap(({ id }) =>
  BY_CATEGORY[id].map((name) => ({ name, category: id })),
);

export function skillIndex(name: string): number {
  return SKILLS.findIndex((skill) => skill.name === name);
}

export function categoryIndices(category: CategoryId): number[] {
  return SKILLS.flatMap((skill, index) =>
    skill.category === category ? [index] : [],
  );
}
