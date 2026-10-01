"use client";

import { useSkillFocus } from "./SkillFocus";

type SkillLinkProps = {
  /** A skill name from the sphere's list. */
  skill: string;
  /** The text shown, when it differs from the skill name. */
  children?: string;
};

/**
 * A technology named in the page prose, wired to the skills sphere: hovering
 * or focusing it lights that skill and turns the sphere to face it; clicking
 * sends pulses out from it.
 */
export function SkillLink({ skill, children }: SkillLinkProps) {
  const focus = useSkillFocus();

  return (
    <button
      type="button"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") focus.focusSkill(skill);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") focus.releaseSkill(skill);
      }}
      onFocus={() => focus.focusSkill(skill)}
      onBlur={() => focus.releaseSkill(skill)}
      onClick={() => focus.pulseSkill(skill)}
      className="cursor-pointer border-b border-dashed border-accent/50 p-0 font-[inherit] text-accent transition-colors duration-300 hover:border-accent"
    >
      {children ?? skill}
    </button>
  );
}
