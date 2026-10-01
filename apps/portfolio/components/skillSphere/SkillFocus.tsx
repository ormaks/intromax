"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { categoryIndices, skillIndex, type CategoryId } from "./skills";
import type { LinkMode, Sphere } from "./sphere";

export type SkillFocus = {
  /** The sphere connects itself here; returns its disconnect. */
  connect(sphere: Sphere): () => void;
  /** A skill named in the prose: lights just that skill and turns to it. */
  focusSkill(name: string): void;
  pulseSkill(name: string): void;
  /** A category chip: lights the whole group and turns to it. */
  focusCategory(category: CategoryId): void;
  pulseCategory(category: CategoryId): void;
  /**
   * Ends the focus a prose link or chip set. Only the one that set the
   * current focus can end it, so leaving one control can't cancel another's.
   */
  releaseSkill(name: string): void;
  releaseCategory(category: CategoryId): void;
  /** A word on the sphere itself: lights it and its links, and stops the spin. */
  hoverWord(index: number): void;
  /** Back to whatever a prose link or chip still holds, or to nothing. */
  leaveWord(): void;
  clickWord(index: number): void;
  steer(dx: number, dy: number): void;
  clearSteer(): void;
};

type Held = { key: string; indices: number[]; links: LinkMode };

/*
 * Plain closure state rather than React state: every call goes straight to
 * the sphere's animation loop, and nothing here needs a re-render.
 */
function createSkillFocus(): SkillFocus {
  let sphere: Sphere | null = null;
  let held: Held | null = null;

  const hold = (next: Held) => {
    held = next;
    sphere?.highlight(next.indices, next.links);
    sphere?.focus(next.indices);
  };

  const releaseHeld = (key: string) => {
    if (held?.key !== key) return;
    held = null;
    sphere?.clearHighlight();
    sphere?.release();
  };

  return {
    connect(next) {
      sphere = next;
      return () => {
        if (sphere === next) sphere = null;
      };
    },
    focusSkill(name) {
      const index = skillIndex(name);
      if (index >= 0)
        hold({ key: `skill:${name}`, indices: [index], links: "none" });
    },
    pulseSkill(name) {
      const index = skillIndex(name);
      if (index >= 0) sphere?.pulse([index]);
    },
    focusCategory(category) {
      hold({
        key: `category:${category}`,
        indices: categoryIndices(category),
        links: "within",
      });
    },
    pulseCategory(category) {
      sphere?.pulseGroup(categoryIndices(category));
    },
    releaseSkill(name) {
      releaseHeld(`skill:${name}`);
    },
    releaseCategory(category) {
      releaseHeld(`category:${category}`);
    },
    hoverWord(index) {
      sphere?.freeze(true);
      sphere?.highlight([index], "touching");
    },
    leaveWord() {
      sphere?.freeze(false);
      if (held) sphere?.highlight(held.indices, held.links);
      else sphere?.clearHighlight();
    },
    clickWord(index) {
      sphere?.pulse([index]);
    },
    steer(dx, dy) {
      sphere?.steer(dx, dy);
    },
    clearSteer() {
      sphere?.clearSteer();
    },
  };
}

const SkillFocusContext = createContext<SkillFocus | null>(null);

/**
 * Lets the prose links and category chips drive the skills sphere. Wrap the
 * page content that holds all three.
 */
export function SkillFocusProvider({ children }: { children: ReactNode }) {
  const [focus] = useState(createSkillFocus);
  return <SkillFocusContext value={focus}>{children}</SkillFocusContext>;
}

export function useSkillFocus(): SkillFocus {
  const focus = useContext(SkillFocusContext);
  if (!focus) {
    throw new Error("useSkillFocus must be used inside SkillFocusProvider");
  }
  return focus;
}
