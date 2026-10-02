import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

gsap.registerPlugin(DrawSVGPlugin);

/* The wolf's viewBox height, which the draw-in stagger is spread over. */
const WOLF_HEIGHT = 286;

type Part = SVGPolylineElement | SVGPolygonElement;

function parts(svg: Element) {
  return {
    lines: Array.from(svg.querySelectorAll<Part>("[data-wolf-line]")),
    shapes: Array.from(svg.querySelectorAll<Part>("[data-wolf-shape]")),
  };
}

/** How far down the wolf a part starts, 0 (ears) to 1 (chin). */
function heightOf(part: Part): number {
  return Math.min(...Array.from(part.points, ({ y }) => y)) / WOLF_HEIGHT;
}

/** Hides the wolf's lines and filled shapes, ready for `drawWolfIn`. */
export function hideWolf(svg: Element) {
  const { lines, shapes } = parts(svg);
  gsap.set(lines, { drawSVG: 0 });
  gsap.set(shapes, { opacity: 0 });
}

/**
 * Draws the wolf in from the ears down: each line over `lineDuration`
 * seconds, the lowest starting at `lastLineAt`, and each filled part (the
 * forehead, eyes, nose) fading in as the strokes around it draw.
 *
 * Call it inside a GSAP context (e.g. `useGSAP`) so the timeline is cleaned
 * up with the component.
 */
export function drawWolfIn(
  svg: Element,
  { lineDuration, lastLineAt }: { lineDuration: number; lastLineAt: number },
) {
  const { lines, shapes } = parts(svg);
  return gsap
    .timeline()
    .fromTo(
      lines,
      { drawSVG: 0 },
      {
        drawSVG: "100%",
        duration: lineDuration,
        ease: "none",
        stagger: (_index, line: Part) => heightOf(line) * lastLineAt,
      },
      0,
    )
    .fromTo(
      shapes,
      { opacity: 0 },
      {
        opacity: 1,
        duration: lineDuration,
        stagger: (_index, shape: Part) =>
          heightOf(shape) * lastLineAt + lineDuration / 2,
      },
      0,
    );
}
