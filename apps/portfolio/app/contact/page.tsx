import type { Metadata } from "next";
import { Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { ContactChannels } from "@/components/contactChannels";
import { ContactForm } from "@/components/contactForm";
import { CvCard } from "@/components/cvCard";
import { PageShell } from "@/components/pageShell";
import { RisingLetters } from "@/components/risingLetters";
import { TextSplit } from "@/components/textSplit";

export const metadata: Metadata = {
  title: "Contact - Ormaks",
  description:
    "Get in touch with Maks Chytailo: send a message, find him on GitHub, LinkedIn, Instagram or Telegram, or download his CV.",
};

export default function ContactPage() {
  return (
    <PageShell className="flex flex-col gap-10 desktop:flex-row desktop:items-center desktop:gap-16">
      <div className="desktop:basis-1/2">
        <CodeTag name="h1" />
        <Heading className="text-accent">
          <TextSplit>Contact me</TextSplit>
        </Heading>
        <CodeTag name="h1" closing />

        <Text className="py-2">
          <TextSplit byWord>
            Open to new offers and interesting projects. Write to me here, reach
            me on any channel, or grab my CV.
          </TextSplit>
        </Text>

        <RisingLetters>
          <ContactForm />
        </RisingLetters>
      </div>

      <div className="flex w-full max-w-md flex-col gap-8 desktop:flex-1">
        <div>
          <CodeTag name="find me" selfClosing />
          <ContactChannels className="pt-3" />
        </div>
        <div>
          <CodeTag name="cv" selfClosing />
          <CvCard className="mt-3" />
        </div>
      </div>
    </PageShell>
  );
}
