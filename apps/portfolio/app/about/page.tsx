import type { Metadata } from "next";
import { Card, Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { PageShell } from "@/components/pageShell";
import { TextSplit } from "@/components/textSplit";

export const metadata: Metadata = {
  title: "About — Ormaks",
};

export default function AboutPage() {
  return (
    <PageShell className="flex flex-col gap-6">
      <CodeTag name="h1" />
      <Heading>
        <TextSplit>About me</TextSplit>
      </Heading>
      <CodeTag name="h1" closing />

      <Card className="max-w-prose">
        {/* Headings split by letter; body copy splits by word. */}
        <Text>
          <TextSplit byWord>
            Placeholder bio — the real copy lands with the About page.
          </TextSplit>
        </Text>
      </Card>
    </PageShell>
  );
}
