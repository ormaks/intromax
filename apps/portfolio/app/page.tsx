import { ButtonLink, Container, Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { TextSplit } from "@/components/textSplit";

/*
 * min-h-[80vh]: vertical centering with room for the header on mobile, not a
 * legacy or scale value — Tailwind's only named height near this is
 * min-h-screen (100vh), which pins the CTA off-screen on short viewports.
 */
export default function HomePage() {
  return (
    <Container className="flex min-h-[80vh] flex-col justify-center gap-6">
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
    </Container>
  );
}
