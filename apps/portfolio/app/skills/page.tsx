import type { Metadata } from "next";
import { Card, Container, Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { TextSplit } from "@/components/textSplit";

export const metadata: Metadata = {
  title: "Skills — Ormaks",
};

export default function SkillsPage() {
  return (
    <Container className="flex flex-col gap-6">
      <CodeTag name="h1" />
      <Heading>
        <TextSplit>Skills</TextSplit>
      </Heading>
      <CodeTag name="h1" closing />

      {/*
       * The rotating tag sphere is the page's whole point and is explicitly
       * out of scope here — it needs its own spec (legacy TagCanvas is dead,
       * so it is a rebuild rather than a port). This shell just holds its
       * place so routing and layout are verifiable now.
       */}
      <Card className="grid min-h-72 max-w-prose place-items-center">
        <Text>skills sphere — Stage 4</Text>
      </Card>
    </Container>
  );
}
