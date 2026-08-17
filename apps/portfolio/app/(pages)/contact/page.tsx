import type { Metadata } from "next";
import {
  Button,
  Card,
  Container,
  Heading,
  Input,
  Text,
  TextArea,
} from "@intromax/ui";
import { CodeTag } from "@/app/components/codeTag";
import { TextSplit } from "@/app/components/textSplit";

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
        {/*
         * No action and a disabled submit on purpose: the endpoint is Stage 3.
         * The legacy form never submitted anywhere either, so wiring this up
         * is new functionality rather than a migration — better to show it
         * plainly inert than to fake a success state.
         */}
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="font-tag text-tag">
              name
            </label>
            <Input id="name" name="name" autoComplete="name" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="font-tag text-tag">
              email
            </label>
            <Input id="email" name="email" type="email" autoComplete="email" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="message" className="font-tag text-tag">
              message
            </label>
            <TextArea id="message" name="message" />
          </div>

          <Button type="submit" disabled className="self-start">
            Send
          </Button>
          <Text>form submission arrives in Stage 3</Text>
        </form>
      </Card>
    </Container>
  );
}
