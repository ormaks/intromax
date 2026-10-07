import type { Metadata } from "next";
import NextLink from "next/link";
import { cn, Heading, Text } from "@intromax/ui";
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

          {/* A call to action without a box: the underline keeps drawing
              itself in and the arrow nudges toward the page. */}
          <NextLink
            href="/experience"
            className={cn(
              "group relative mt-6 mb-3 flex w-fit items-center py-1 font-sans text-sm tracking-button text-accent uppercase no-underline tablet:text-base",
              "transition-[text-shadow] duration-300",
              "after:absolute after:bottom-0 after:left-0 after:h-px after:animate-[underline-draw_2.4s_ease-in-out_infinite] after:bg-accent",
              // Hover and focus: the underline settles in full and both it
              // and the label glow, while the arrow hurries.
              "hover:[text-shadow:0_0_10px_color-mix(in_srgb,var(--color-accent)_70%,transparent)] hover:after:w-full hover:after:animate-none hover:after:opacity-100 hover:after:shadow-[0_0_8px_var(--color-accent)]",
              "focus-visible:[text-shadow:0_0_10px_color-mix(in_srgb,var(--color-accent)_70%,transparent)] focus-visible:after:w-full focus-visible:after:animate-none focus-visible:after:opacity-100",
            )}
          >
            See more about my experience
            <span
              aria-hidden="true"
              className="ml-3 inline-block animate-[arrow-nudge_1.6s_ease-in-out_infinite] group-hover:animate-[arrow-nudge_0.6s_ease-in-out_infinite] group-focus-visible:animate-[arrow-nudge_0.6s_ease-in-out_infinite]"
            >
              →
            </span>
          </NextLink>

          <Text className="pt-6">
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
