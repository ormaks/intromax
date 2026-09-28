import type { Metadata } from "next";
import { Card, Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { PageShell } from "@/components/pageShell";
import { TextSplit } from "@/components/textSplit";

export const metadata: Metadata = {
  title: "Skills — Ormaks",
};

export default function SkillsPage() {
  return (
    <PageShell className="flex flex-col gap-6">
      <CodeTag name="h1" />
      <Heading>
        <TextSplit>Skills</TextSplit>
      </Heading>
      <CodeTag name="h1" closing />

      {/*
       * The rotating skills sphere is the page's whole point and gets its own
       * spec. This placeholder holds its place so routing and layout are
       * verifiable now.
       */}
      <Card className="grid min-h-72 max-w-prose place-items-center">
        <Text>skills sphere — Stage 4</Text>
      </Card>
    </PageShell>
  );
}
