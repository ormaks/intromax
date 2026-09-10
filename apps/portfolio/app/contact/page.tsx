import type { Metadata } from "next";
import { Card, Container, Heading } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { ContactForm } from "@/components/contactForm";
import { TextSplit } from "@/components/textSplit";

export const metadata: Metadata = {
  title: "Contact — Ormaks",
};

export default function ContactPage() {
  return (
    <Container className="flex flex-col gap-6">
      <CodeTag name="h1" />
      <Heading>
        <TextSplit>Contact me</TextSplit>
      </Heading>
      <CodeTag name="h1" closing />

      <Card className="max-w-xl">
        <ContactForm />
      </Card>
    </Container>
  );
}
