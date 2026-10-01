import type { Metadata } from "next";
import { Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { MusicPlayer } from "@/components/musicPlayer";
import { PageShell } from "@/components/pageShell";
import { ReactiveWolf } from "@/components/reactiveWolf";
import { TextSplit } from "@/components/textSplit";

export const metadata: Metadata = {
  title: "About - Ormaks",
  description:
    "About Maks Chytailo, a senior frontend developer building large-scale web platforms, design systems and animation-rich interfaces.",
};

const BIO = [
  "I'm a senior frontend developer, building for the web since 2017 - from enterprise platforms to design-led sites where motion and interaction are the point.",
  "Most recently I worked on a large-scale workforce management SaaS: a modular monorepo across web, iOS and Android. I built complex features across its microservice frontend, maintained the shared design system, and brought AI-powered features into the product.",
  "Along the way I've built a crypto finance platform with payments, a billing integration with complex subscription flows and role-based access, and an internal CRM with analytics dashboards.",
  "I've also owned smaller, animation-heavy projects end to end, from architecture through launch and support.",
  "My focus now is frontend architecture, monorepos, performance and design systems.",
  "Open to new offers - get in touch.",
];

export default function AboutPage() {
  return (
    <PageShell
      // About's margins: 9% on mobile and tablet, 6% on desktop.
      inset="mr-[5%] ml-[9%] desktop:mr-0 desktop:ml-[6%]"
      className="flex flex-col gap-8 desktop:flex-row desktop:items-center desktop:gap-16"
    >
      <div className="desktop:basis-1/2">
        <CodeTag name="h1" />
        <Heading className="text-accent">
          <TextSplit>About me</TextSplit>
        </Heading>
        <CodeTag name="h1" closing />

        <div className="flex flex-col gap-3 py-3">
          {BIO.map((paragraph) => (
            <Text key={paragraph}>
              <TextSplit byWord>{paragraph}</TextSplit>
            </Text>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-start gap-6 desktop:flex-1 desktop:items-center">
        <ReactiveWolf />
        <MusicPlayer
          trackId={236967116}
          trackUrl="https://soundcloud.com/ereny_youssef/amy-winehouse-back-to-black"
          className="w-full tablet:w-4/5 desktop:w-full desktop:max-w-md"
        />
      </div>
    </PageShell>
  );
}
