import type { Metadata } from "next";
import { ButtonLink, Heading } from "@intromax/ui";
import { CaseStudy } from "@/components/caseStudy";
import { CodeTag } from "@/components/codeTag";
import { PageShell } from "@/components/pageShell";
import { TextSplit } from "@/components/textSplit";
import {
  CAREER,
  CAREER_NOTE,
  CASE_STUDIES,
  INTRO,
  STRENGTHS,
} from "@/constants/experience";

export const metadata: Metadata = {
  title: "Experience - Ormaks",
  description:
    "Case studies from Maks Chytailo's frontend work: an enterprise workforce platform used by 3 million people, billing for a packaging software leader, design-led sites and early product work.",
};

const JUMP_LINKS = [
  ...CASE_STUDIES.map(({ id, label }) => ({ id, label })),
  { id: "career", label: "Career" },
];

export default function ExperiencePage() {
  return (
    <PageShell scroll className="flex flex-col gap-10 desktop:py-8">
      <header className="flex flex-col gap-4">
        <div>
          <CodeTag name="h1" />
          <Heading className="text-accent">
            <TextSplit>Experience</TextSplit>
          </Heading>
          <CodeTag name="h1" closing />
        </div>

        <div className="grid gap-6 desktop:grid-cols-[minmax(0,52rem)_17rem] desktop:gap-x-12">
          <div className="reading-text flex flex-col gap-3">
            {INTRO.map((paragraph) => (
              <p key={paragraph} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>

          <div>
            <CodeTag name="what I bring" selfClosing />
            <ul
              role="list"
              aria-label="What I bring"
              className="m-0 mt-1 flex list-none flex-col gap-2.5 p-0 font-reading text-[0.875rem] leading-snug text-foreground"
            >
              {STRENGTHS.map(({ lead, text }) => (
                <li key={lead} className="border-l border-accent/60 pl-3">
                  <strong className="font-semibold text-accent">{lead}</strong>{" "}
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <nav aria-label="On this page">
          <ul
            role="list"
            className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 font-mono text-caption"
          >
            {JUMP_LINKS.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-foreground underline decoration-accent/50 underline-offset-4 transition-colors duration-300 hover:text-accent"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {CASE_STUDIES.map((study) => (
        <CaseStudy key={study.id} study={study} />
      ))}

      <section
        id="career"
        aria-labelledby="career-heading"
        className="scroll-mt-(--height-header) desktop:scroll-mt-12"
      >
        <CodeTag name="section" />
        <div className="flex flex-col gap-4 py-2 tablet:pl-4">
          <h2
            id="career-heading"
            className="m-0 font-heading text-heading-md-sm font-normal text-accent tablet:text-heading-md"
          >
            Career
          </h2>
          <ol
            role="list"
            className="reading-text m-0 flex max-w-4xl list-none flex-col p-0"
          >
            {CAREER.map(({ period, role, company }) => (
              <li
                key={period}
                className="flex flex-col gap-0.5 border-l border-accent/40 py-2 pl-4 tablet:flex-row tablet:gap-4"
              >
                <span className="shrink-0 font-mono text-caption text-subtle tablet:w-40 tablet:pt-1">
                  {period}
                </span>
                <span>
                  <span className="font-semibold">{role}</span>
                  <span className="text-subtle"> · {company}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="reading-text m-0 max-w-4xl">{CAREER_NOTE}</p>
        </div>
        <CodeTag name="section" closing />
      </section>

      <div className="flex flex-col items-start gap-4 pb-4">
        <p className="reading-text m-0">
          Have a project in mind? Let&apos;s talk.
        </p>
        <ButtonLink href="/contact" size="responsive">
          Contact me
        </ButtonLink>
      </div>
    </PageShell>
  );
}
