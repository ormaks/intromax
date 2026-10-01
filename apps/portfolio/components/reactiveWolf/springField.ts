import gsap from "gsap";

/* Pointer influence, in viewBox units: how far it reaches, how hard it pushes. */
const RADIUS = 70;
const PUSH = 26;
/* A click's shockwave: how far it reaches and the outward speed it gives. */
const KICK_RADIUS = 120;
const KICK = 9;
/* Spring feel: pull toward the target each frame, and velocity kept. */
const STIFFNESS = 0.1;
const DAMPING = 0.78;
/* Below this much movement per frame, everything counts as settled. */
const REST = 0.01;

type Shape = SVGPolylineElement | SVGPolygonElement;

type Vertex = {
  /** Original position. */
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
};

type Part = { element: Shape; vertices: Vertex[] };

export type SpringField = {
  /** Takes over these elements, starting from their current points. */
  attach(elements: Shape[]): void;
  /** Pushes vertices away from a point (viewBox coordinates). */
  repel(x: number, y: number): void;
  /**
   * Knocks vertices outward from a point (viewBox coordinates) without moving
   * their targets, so they wobble back on the spring.
   */
  kick(x: number, y: number): void;
  /** Lets every vertex spring back to where it started. */
  release(): void;
  /** Stops animating and forgets the elements. */
  detach(): void;
};

/**
 * Spring physics for line art: every vertex of the attached polylines and
 * polygons eases toward a target, `repel` moves those targets away from a
 * point, and `kick` gives vertices an outward shove. Both depend only on a
 * vertex's original position, so vertices shared between elements stay
 * joined.
 *
 * Runs on GSAP's ticker, and only while something is still moving.
 */
export function createSpringField(): SpringField {
  let parts: Part[] = [];
  let isTicking = false;

  const step = () => {
    let motion = 0;
    for (const part of parts) {
      for (const v of part.vertices) {
        v.vx = (v.vx + (v.tx - v.x) * STIFFNESS) * DAMPING;
        v.vy = (v.vy + (v.ty - v.y) * STIFFNESS) * DAMPING;
        v.x += v.vx;
        v.y += v.vy;
        motion = Math.max(
          motion,
          Math.abs(v.vx) + Math.abs(v.vy),
          Math.abs(v.tx - v.x) + Math.abs(v.ty - v.y),
        );
      }
      part.element.setAttribute(
        "points",
        part.vertices
          .map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`)
          .join(" "),
      );
    }
    if (motion < REST) stop();
  };

  const start = () => {
    if (isTicking) return;
    isTicking = true;
    gsap.ticker.add(step);
  };

  const stop = () => {
    gsap.ticker.remove(step);
    isTicking = false;
  };

  return {
    attach(elements) {
      parts = elements.map((element) => ({
        element,
        vertices: Array.from(element.points, ({ x, y }) => ({
          ox: x,
          oy: y,
          x,
          y,
          vx: 0,
          vy: 0,
          tx: x,
          ty: y,
        })),
      }));
    },

    repel(x, y) {
      for (const part of parts) {
        for (const v of part.vertices) {
          const dx = v.ox - x;
          const dy = v.oy - y;
          const distance = Math.hypot(dx, dy);
          if (distance >= RADIUS || distance === 0) {
            v.tx = v.ox;
            v.ty = v.oy;
            continue;
          }
          const strength = (1 - distance / RADIUS) ** 2 * PUSH;
          v.tx = v.ox + (dx / distance) * strength;
          v.ty = v.oy + (dy / distance) * strength;
        }
      }
      if (parts.length > 0) start();
    },

    kick(x, y) {
      for (const part of parts) {
        for (const v of part.vertices) {
          const dx = v.ox - x;
          const dy = v.oy - y;
          const distance = Math.hypot(dx, dy);
          if (distance >= KICK_RADIUS || distance === 0) continue;
          const speed = (1 - distance / KICK_RADIUS) * KICK;
          v.vx += (dx / distance) * speed;
          v.vy += (dy / distance) * speed;
        }
      }
      if (parts.length > 0) start();
    },

    release() {
      for (const part of parts) {
        for (const v of part.vertices) {
          v.tx = v.ox;
          v.ty = v.oy;
        }
      }
      if (parts.length > 0) start();
    },

    detach() {
      stop();
      parts = [];
    },
  };
}
