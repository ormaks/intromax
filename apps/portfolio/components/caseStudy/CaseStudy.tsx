import { cn } from "@intromax/ui";
import { CodeTag } from "@/components/codeTag";
import { Diagram } from "@/components/diagram";
import type {
  Block,
  CaseStudy as CaseStudyData,
  Passage,
} from "@/constants/experience";

function PassageText({ passage }: { passage: Passage }) {
  return (
    <>
      {passage.lead && (
        <strong className="font-semibold text-accent">{passage.lead} </strong>
      )}
      {passage.text}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <p className="m-0">
          <PassageText passage={block.passage} />
        </p>
      );
    case "subheading":
      return (
        <h3 className="m-0 mt-2 font-reading text-reading font-semibold text-accent">
          {block.text}
        </h3>
      );
    case "list":
      return (
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 marker:text-accent">
          {block.items.map((item) => (
            <li key={item.text}>
              <PassageText passage={item} />
            </li>
          ))}
        </ul>
      );
    case "diagram":
      return <Diagram id={block.id} className="my-2" />;
  }
}

/**
 * One case study: the section's code tag, an `h2` with the client and role,
 * the body, and a side column with key facts and the stack as chips.
 *
 * On desktop the facts and stack sit beside the body. Below that they stack
 * in reading order: facts, body, stack.
 */
export function CaseStudy({
  study,
  className,
}: {
  study: CaseStudyData;
  className?: string;
}) {
  const headingId = `${study.id}-heading`;

  return (
    <section
      id={study.id}
      aria-labelledby={headingId}
      // Clears the fixed header bar below desktop when a jump link lands here.
      className={cn(
        "scroll-mt-(--height-header) desktop:scroll-mt-12",
        className,
      )}
    >
      <CodeTag name="section" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 py-2 tablet:pl-4 desktop:grid-cols-[minmax(0,52rem)_17rem] desktop:grid-rows-[auto_auto_auto_1fr] desktop:gap-x-12">
        <div className="flex flex-col gap-1 desktop:col-span-2">
          <h2
            id={headingId}
            className="m-0 font-heading text-heading-md-sm font-normal text-accent tablet:text-heading-md"
          >
            {study.title}
          </h2>
          {study.subtitle && (
            <p className="m-0 font-mono text-caption text-subtle">
              {study.subtitle}
            </p>
          )}
        </div>

        <div className="desktop:col-start-2 desktop:row-start-2">
          <CodeTag name="key facts" selfClosing />
          <ul
            role="list"
            aria-label="Key facts"
            className="m-0 mt-1 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 font-mono text-caption text-foreground desktop:flex-col desktop:gap-2"
          >
            {study.facts.map((fact, index) => (
              <li
                key={fact}
                className="flex items-center gap-3 desktop:border-l desktop:border-accent/60 desktop:pl-3"
              >
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="text-accent desktop:hidden"
                  >
                    ·
                  </span>
                )}
                {fact}
              </li>
            ))}
          </ul>
        </div>

        <div className="reading-text flex flex-col gap-3 desktop:col-start-1 desktop:row-span-3 desktop:row-start-2">
          {study.blocks.map((block, index) => (
            <BlockView key={index} block={block} />
          ))}
        </div>

        <div className="desktop:col-start-2 desktop:row-start-3">
          <CodeTag name="stack" selfClosing />
          <ul
            role="list"
            aria-label="Stack"
            className="m-0 mt-1 flex list-none flex-wrap gap-2 p-0"
          >
            {study.stack.map((tech) => (
              <li
                key={tech}
                className="rounded-control border border-accent/70 px-2 py-1 font-mono text-caption text-accent"
              >
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <CodeTag name="section" closing />
    </section>
  );
}
