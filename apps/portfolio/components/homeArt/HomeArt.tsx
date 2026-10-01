"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "@intromax/ui";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useRef } from "react";
import { usePreloaderDone } from "@/components/preloader";
import { Wolf } from "@/components/wolf";
import { Wordmark } from "@/components/wordmark";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MEDIA } from "@/constants/breakpoints";

gsap.registerPlugin(useGSAP, DrawSVGPlugin);

/* The wolf's natural height, which its stroke stagger is spread over. */
const WOLF_HEIGHT = 286;
const WOLF_LINE_DURATION = 0.6;
/* The last (lowest) wolf line starts here, so the strokes finish at ~3s. */
const WOLF_LAST_LINE_AT = 2.4;
const WORDMARK_DRAW_DURATION = 4;
/* The fill arrives over the last 20% of the draw. */
const WORDMARK_FILL_DURATION = WORDMARK_DRAW_DURATION * 0.2;

/* A neon-tube flicker: a burst of dips early in each 5s cycle, one late. */
const NEON_BLINK = {
  "0%": { opacity: 1 },
  "10%": { opacity: 0.6 },
  "12%": { opacity: 1 },
  "15%": { opacity: 0.4 },
  "17%": { opacity: 1 },
  "18%": { opacity: 0.3 },
  "19%": { opacity: 1 },
  "29%": { opacity: 1 },
  "30%": { opacity: 0.9 },
  "33%": { opacity: 1 },
  "89%": { opacity: 1 },
  "91%": { opacity: 0.7 },
  "94%": { opacity: 1 },
  "100%": { opacity: 1 },
};

/**
 * Home's right-hand art: the wolf, the "Ormaks" wordmark and its faint
 * mirrored reflection.
 *
 * - **desktop** — anchored past the right edge: the wolf top right, the
 *   wordmark rotated 45° below it, and the reflection under that.
 * - **tablet** — a centred column under the page text: the wolf, then the
 *   wordmark upright. No reflection.
 * - **mobile** — only the wolf, as a near-invisible watermark. The wordmark
 *   isn't mounted and nothing animates.
 *
 * Once the preloader lifts, the wordmark writes itself in over 4s (its fill
 * arriving over the last 20%) while the wolf draws from the ears down, each
 * filled part (forehead, eyes, nose) fading in as the strokes reach it. The
 * wordmark flickers like a neon sign on a loop throughout.
 *
 * The server markup is the finished picture; the animation hides the strokes
 * on mount, under the preloader, so visitors without JavaScript still see it.
 */
/**
 * Stagger delay for a wolf part: top to bottom by its highest point, so mirror
 * pairs draw together.
 */
function byHeight(_index: number, part: SVGGraphicsElement): number {
  return (part.getBBox().y / WOLF_HEIGHT) * WOLF_LAST_LINE_AT;
}

export function HomeArt() {
  const scope = useRef<HTMLDivElement>(null);
  const done = usePreloaderDone();
  const showWordmark = useMediaQuery(MEDIA.tabletUp);
  const showReflection = useMediaQuery(MEDIA.desktopUp);

  useGSAP(
    () => {
      if (!showWordmark) return;

      const glyphs = gsap.utils.toArray<SVGPathElement>(
        "[data-wordmark-glyph]",
      );
      const lines = gsap.utils.toArray<SVGGraphicsElement>("[data-wolf-line]");
      const shapes =
        gsap.utils.toArray<SVGGraphicsElement>("[data-wolf-shape]");

      if (!done) {
        gsap.set([...glyphs, ...lines], { drawSVG: 0 });
        gsap.set(glyphs, { fillOpacity: 0 });
        gsap.set(shapes, { opacity: 0 });
        return;
      }

      gsap
        .timeline()
        .fromTo(
          glyphs,
          { drawSVG: 0 },
          { drawSVG: "100%", duration: WORDMARK_DRAW_DURATION, ease: "none" },
          0,
        )
        .fromTo(
          glyphs,
          { fillOpacity: 0 },
          { fillOpacity: 1, duration: WORDMARK_FILL_DURATION, ease: "none" },
          WORDMARK_DRAW_DURATION - WORDMARK_FILL_DURATION,
        )
        .fromTo(
          lines,
          { drawSVG: 0 },
          {
            drawSVG: "100%",
            duration: WOLF_LINE_DURATION,
            ease: "none",
            stagger: byHeight,
          },
          0,
        )
        .fromTo(
          shapes,
          { opacity: 0 },
          {
            opacity: 1,
            duration: WOLF_LINE_DURATION,
            // Each filled part fades in as the strokes around it draw.
            stagger: (index, shape: SVGGraphicsElement) =>
              byHeight(index, shape) + WOLF_LINE_DURATION / 2,
          },
          0,
        );

      gsap.to(glyphs, {
        keyframes: { ...NEON_BLINK, easeEach: "none" },
        duration: 5,
        repeat: -1,
      });
    },
    {
      scope,
      dependencies: [done, showWordmark, showReflection],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={scope}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden",
        // Mobile and tablet: sits at the bottom of the page, which on tablet
        // is at least 768px tall so the art clears the text above it.
        "flex flex-col justify-end tablet:min-h-192",
        "desktop:inset-0 desktop:block desktop:min-h-0",
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center",
          "desktop:absolute desktop:top-0 desktop:-right-[123px] desktop:block",
        )}
      >
        <Wolf
          className={cn(
            "h-auto w-4/5 text-accent opacity-2",
            "tablet:h-71.5 tablet:w-52 tablet:opacity-100",
            "desktop:absolute desktop:top-[30px] desktop:right-[145px]",
          )}
        />

        {showWordmark && (
          <Wordmark
            width={759}
            height={286}
            x={370}
            y={195}
            fill="#222324"
            preserveAspectRatio="xMidYMin slice"
            className={cn(
              "hidden shrink-0 stroke-accent tablet:block",
              "drop-shadow-[-1px_0_28px_rgb(8_253_216/0.26)]",
              "-mt-[100px] h-[232px]",
              "desktop:mt-[155px] desktop:h-[286px] desktop:rotate-45",
            )}
          />
        )}

        {showReflection && (
          <Wordmark
            width={713}
            height={224}
            x={350}
            y={200}
            fill="rgb(37 38 39 / 0.5)"
            stroke="rgb(8 253 216 / 0.04)"
            className="absolute top-[314px] right-[156px] hidden blur-[2px] [transform:rotate(-135deg)_rotateY(180deg)] desktop:block"
          />
        )}
      </div>
    </div>
  );
}
