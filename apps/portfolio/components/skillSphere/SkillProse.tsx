import { Fragment } from "react";
import { TextSplit } from "@/components/textSplit";
import { SkillLink } from "./SkillLink";

/* `[Skill]` or `[Skill|shown text]` marks a technology wired to the sphere. */
const MARKER = /\[([^\]|]+)(?:\|([^\]]+))?\]/g;

/**
 * Word-split prose with sphere links: write skills as `[React]`, or
 * `[Design systems|design systems]` when the text differs from the name.
 */
export function SkillProse({ children }: { children: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of children.matchAll(MARKER)) {
    const [whole, skill, shown] = match;
    if (!skill) continue;
    if (match.index > last) {
      parts.push(
        <TextSplit key={`text-${last}`} byWord>
          {children.slice(last, match.index)}
        </TextSplit>,
      );
    }
    parts.push(
      <SkillLink key={`skill-${match.index}`} skill={skill}>
        {shown}
      </SkillLink>,
    );
    last = match.index + whole.length;
  }
  if (last < children.length) {
    parts.push(
      <TextSplit key={`text-${last}`} byWord>
        {children.slice(last)}
      </TextSplit>,
    );
  }
  return <Fragment>{parts}</Fragment>;
}
