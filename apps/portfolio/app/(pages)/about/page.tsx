import type { Metadata } from "next";
import { Card, Container, Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/app/components/codeTag";
import { TextSplit } from "@/app/components/textSplit";

export const metadata: Metadata = {
  title: "About — Ormaks",
};

export default function AboutPage() {
  return (
    <Container className="flex flex-col gap-6">
      <CodeTag name="h1" />
      <Heading>
        <TextSplit>About me</TextSplit>
      </Heading>
      <CodeTag name="h1" closing />

      <Card className="max-w-prose">
        <Text>
          Placeholder bio. The legacy copy predates most of the work worth
          mentioning, so it is being rewritten rather than ported — Stage 4.
        </Text>
      </Card>
    </Container>
  );
}
