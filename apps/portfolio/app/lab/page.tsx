import type { Metadata } from "next";
import { Heading, Text } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { PageShell } from "@/components/pageShell";
import { RunnerGame } from "@/components/runnerGame";
import { TextSplit } from "@/components/textSplit";

export const metadata: Metadata = {
  title: "Lab - Ormaks",
  description:
    "The Lab: pet projects by Maks Chytailo, small apps for trying new libraries and ideas. Coming soon - meanwhile, try to beat his record in the runner game.",
};

export default function LabPage() {
  return (
    <PageShell
      // Even margins, so the centred column sits in the middle of the frame.
      inset="mx-[5%] desktop:mx-[6%]"
      className="flex flex-col items-center gap-6 text-center desktop:my-auto"
    >
      <div className="max-w-2xl">
        <CodeTag name="h1" />
        <Heading className="text-accent">
          <TextSplit>Lab</TextSplit>
        </Heading>
        <CodeTag name="h1" closing />

        <p className="m-0 pt-3 pb-2 font-heading text-heading-md-sm text-foreground tablet:text-heading-md">
          <TextSplit>Coming soon...</TextSplit>
        </p>

        <div className="flex flex-col gap-3 py-2">
          <Text>
            <TextSplit byWord>
              A place for the pet projects I&apos;m building: small apps where I
              try new libraries and ideas.
            </TextSplit>
          </Text>
          <Text>
            <TextSplit byWord>
              Nothing to explore yet, so meanwhile - try to beat my record.
            </TextSplit>
          </Text>
        </div>
      </div>

      <RunnerGame className="w-full max-w-4xl" />
    </PageShell>
  );
}
