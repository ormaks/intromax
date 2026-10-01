import type { Metadata } from "next";
import { ButtonLink, Heading } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { HomeArt } from "@/components/homeArt";
import { PageShell } from "@/components/pageShell";
import { TextSplit } from "@/components/textSplit";

export const metadata: Metadata = {
  description:
    "Maks Chytailo, a frontend developer building with React, TypeScript and Next.js.",
};

export default function HomePage() {
  return (
    <PageShell
      // Home's margins: 13% on mobile, 9% on tablet, 6% on desktop.
      inset="mr-[5%] ml-[13%] tablet:ml-[9%] desktop:mr-0 desktop:ml-[6%]"
      backdrop={<HomeArt />}
    >
      <CodeTag name="h1" />

      <Heading>
        <TextSplit>Hi,</TextSplit>
        <br />
        <TextSplit>I&apos;m Maks,</TextSplit>
        <br />
        <TextSplit>frontend developer.</TextSplit>
      </Heading>

      <CodeTag name="h1" closing />

      <p className="m-0 text-caption text-subtle">
        React / TypeScript / Next.js
      </p>

      <ButtonLink href="/contact" size="responsive" className="mt-6">
        Contact me
      </ButtonLink>
    </PageShell>
  );
}
