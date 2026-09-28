import { ButtonLink, Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { PageShell } from "@/components/pageShell";
import { TextSplit } from "@/components/textSplit";

export default function HomePage() {
  return (
    <PageShell className="flex flex-col gap-6">
      <CodeTag name="h1" />

      <Heading>
        <TextSplit>Hi, I am Maks</TextSplit>
      </Heading>
      <Heading as="h2" className="text-accent">
        <TextSplit>Frontend developer</TextSplit>
      </Heading>

      <CodeTag name="h1" closing />

      <Text className="max-w-prose">
        Placeholder copy — the real intro lands in Stage 4 alongside the rest of
        the content rewrite.
      </Text>

      <ButtonLink href="/contact" className="self-start">
        Contact me
      </ButtonLink>
    </PageShell>
  );
}
