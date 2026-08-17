import { Container, Heading, Link } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { TextSplit } from "@/components/textSplit";

// Same reasoning as the home page's min-h-[80vh]: no scale equivalent.
export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col justify-center gap-6">
      <CodeTag name="h1" />
      <Heading>
        <TextSplit>404</TextSplit>
      </Heading>
      <Heading as="h2" className="text-accent">
        <TextSplit>Page not found</TextSplit>
      </Heading>
      <CodeTag name="h1" closing />

      {/* The legacy glitch/noise treatment is a Stage 4 fidelity concern. */}
      <Link href="/" className="self-start">
        back home
      </Link>
    </Container>
  );
}
