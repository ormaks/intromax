"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "@intromax/ui";
import gsap from "gsap";
import { useEffect, useRef, type PointerEvent } from "react";
import { usePreloaderDone } from "@/components/preloader";
import { useSkillFocus } from "./SkillFocus";
import { CATEGORIES, SKILLS } from "./skills";
import { createSphere } from "./sphere";

gsap.registerPlugin(useGSAP);

const FADE_IN_SECONDS = 3;

/**
 * The skills sphere: every skill floats on a slowly turning sphere, linked to
 * its nearest neighbours, with each category gathered in its own region.
 *
 * - The pointer steers the spin anywhere over this column; its offset from
 *   the centre sets the speed and direction. Touch doesn't steer.
 * - Hovering a word lights it and its links and stops the spin; clicking sends
 *   pulses out along the links.
 * - The prose links and category chips drive it too, through `SkillFocus`.
 *
 * The skills are a real list. Until the sphere takes over (and without
 * JavaScript) it shows as a plain wrapped list of names.
 */
export function SkillSphere({ className }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const focus = useSkillFocus();
  const done = usePreloaderDone();

  useEffect(() => {
    const boxElement = box.current;
    const canvasElement = canvas.current;
    const listElement = list.current;
    if (!boxElement || !canvasElement || !listElement) return;

    const sphere = createSphere(
      SKILLS,
      CATEGORIES.map(({ id }) => id),
      {
        box: boxElement,
        canvas: canvasElement,
        words: Array.from(
          listElement.children,
          (child) => child as HTMLElement,
        ),
      },
    );
    listElement.dataset.sphere = "on";
    const disconnect = focus.connect(sphere);
    const observer = new ResizeObserver(() => sphere.resize());
    observer.observe(boxElement);

    return () => {
      observer.disconnect();
      disconnect();
      sphere.destroy();
      delete listElement.dataset.sphere;
    };
  }, [focus]);

  useGSAP(
    () => {
      if (!done) {
        gsap.set(box.current, { opacity: 0 });
        return;
      }
      gsap.fromTo(
        box.current,
        { opacity: 0 },
        { opacity: 1, duration: FADE_IN_SECONDS, ease: "power1.out" },
      );
    },
    { dependencies: [done], revertOnUpdate: true },
  );

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));
    focus.steer(
      clamp(
        (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2),
      ),
      clamp(
        (event.clientY - (bounds.top + bounds.height / 2)) /
          (bounds.height / 2),
      ),
    );
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={() => focus.clearSteer()}
      className={cn("flex items-center justify-center", className)}
    >
      <div ref={box} className="relative aspect-square w-full max-w-120">
        <canvas
          ref={canvas}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
        />
        <ul
          ref={list}
          // list-none drops list semantics in Safari; the role puts them back.
          role="list"
          aria-label="Skills"
          className="group/sphere m-0 flex list-none flex-wrap content-center justify-center gap-x-4 gap-y-2 p-0 data-[sphere=on]:block"
        >
          {SKILLS.map((skill, index) => (
            <li
              key={skill.name}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") focus.hoverWord(index);
              }}
              onPointerLeave={() => focus.leaveWord()}
              onClick={() => focus.clickWord(index)}
              className="cursor-pointer font-mono text-sm whitespace-nowrap text-accent select-none group-data-[sphere=on]/sphere:absolute group-data-[sphere=on]/sphere:top-0 group-data-[sphere=on]/sphere:left-0 group-data-[sphere=on]/sphere:will-change-transform"
            >
              {skill.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
