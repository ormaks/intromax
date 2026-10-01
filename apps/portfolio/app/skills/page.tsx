import type { Metadata } from "next";
import { Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { PageShell } from "@/components/pageShell";
import {
  CategoryChips,
  SkillFocusProvider,
  SkillProse,
  SkillSphere,
} from "@/components/skillSphere";
import { TextSplit } from "@/components/textSplit";

export const metadata: Metadata = {
  title: "Skills - Ormaks",
  description:
    "The skills and tools Maks Chytailo works with, from React, TypeScript and Next.js to testing and monorepo tooling.",
};

const LINKEDIN = "https://www.linkedin.com/in/ormaks/";

export default function SkillsPage() {
  return (
    <SkillFocusProvider>
      <PageShell className="flex flex-col gap-8 desktop:flex-row desktop:items-center desktop:gap-8">
        <div className="desktop:basis-1/2">
          <CodeTag name="h1" />
          <Heading className="text-accent">
            <TextSplit>Skills &amp;</TextSplit>
            <br />
            <TextSplit>Experience</TextSplit>
          </Heading>
          <CodeTag name="h1" closing />

          <div className="flex flex-col gap-3 py-3">
            <Text>
              <SkillProse>
                {
                  "My main area is frontend development: scalable web apps with [React], [TypeScript] and [Next.js] - from component architecture and [Design systems|design systems] to complex UI features and animation with [GSAP]."
                }
              </SkillProse>
            </Text>
            <Text>
              <SkillProse>
                {
                  "Around that I work with [GraphQL] and [REST] data layers, state management with [Redux] and [MobX], testing with [Jest] and [Playwright], and monorepo tooling like [Nx]. I also have experience with [Angular] and [Node.js]."
                }
              </SkillProse>
            </Text>
          </div>

          <CategoryChips className="py-3" />

          <Text className="pt-3">
            <TextSplit byWord>Want to know more? Check my </TextSplit>
            <TextSplit href={LINKEDIN}>LinkedIn</TextSplit>
            <TextSplit byWord> profile or </TextSplit>
            <TextSplit href="/contact">contact</TextSplit>
            <TextSplit byWord> me.</TextSplit>
          </Text>
        </div>

        <SkillSphere className="desktop:flex-1 desktop:self-stretch" />
      </PageShell>
    </SkillFocusProvider>
  );
}
