import type { Metadata } from "next";
import { Card, Container, Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { TextSplit } from "@/components/textSplit";

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
        {/*
         * Word-split, matching the legacy About page's own prose treatment
         * (`splitBy="words"` throughout `About.js`) — headings split by
         * letter, body copy splits by word.
         */}
        <Text>
          <TextSplit byWord>
            Placeholder bio. The legacy copy predates most of the work worth
            mentioning, so it is being rewritten rather than ported — Stage 4.
          </TextSplit>
        </Text>
      </Card>
    </Container>
  );
}
